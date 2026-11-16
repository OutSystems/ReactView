import * as http from "http";
import WebSocket from "ws";

/*
 * Minimal Chrome DevTools Protocol client for the views of a ReactView application (ReactViewFactory.RemoteDebuggingPort).
 * One connection per page target, kept open so that console messages and exceptions are collected continuously.
 * */

export interface PageTarget {
    id: string;
    url: string;
    title: string;
    webSocketDebuggerUrl: string;
}

export interface ConsoleEntry {
    time: string;
    level: string;
    text: string;
}

const MaxConsoleEntries = 500;

class PageSession {
    private ws: WebSocket | null = null;
    private nextId = 0;
    private readonly pending = new Map<number, { resolve: (v: any) => void, reject: (e: Error) => void }>();
    public readonly console: ConsoleEntry[] = [];

    constructor(public readonly target: PageTarget) { }

    public async connect(): Promise<void> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }
        const ws = new WebSocket(this.target.webSocketDebuggerUrl.replace("localhost", "127.0.0.1"), { perMessageDeflate: false });
        await new Promise<void>((resolve, reject) => {
            ws.once("open", () => resolve());
            ws.once("error", e => reject(e));
        });
        ws.on("message", data => this.onMessage(JSON.parse(data.toString())));
        ws.on("close", () => { this.ws = null; this.pending.forEach(p => p.reject(new Error("devtools connection closed"))); this.pending.clear(); });
        this.ws = ws;
        await this.send("Runtime.enable");
        await this.send("Log.enable");
    }

    public send(method: string, params: object = {}, timeoutMs: number = 15000): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                reject(new Error("not connected"));
                return;
            }
            const id = ++this.nextId;
            const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`${method} timed out after ${timeoutMs}ms (is the view responsive?)`)); }, timeoutMs);
            this.pending.set(id, {
                resolve: v => { clearTimeout(timer); resolve(v); },
                reject: e => { clearTimeout(timer); reject(e); }
            });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    public close(): void {
        this.ws?.close();
        this.ws = null;
    }

    private onMessage(message: any): void {
        if (message.id && this.pending.has(message.id)) {
            const p = this.pending.get(message.id)!;
            this.pending.delete(message.id);
            if (message.error) {
                p.reject(new Error(message.error.message));
            } else {
                p.resolve(message.result);
            }
            return;
        }
        const time = new Date().toISOString();
        if (message.method === "Runtime.consoleAPICalled") {
            this.push({ time, level: message.params.type, text: message.params.args.map((a: any) => a.value ?? a.description ?? "").join(" ") });
        } else if (message.method === "Runtime.exceptionThrown") {
            const d = message.params.exceptionDetails;
            this.push({ time, level: "exception", text: d.exception?.description || d.text });
        } else if (message.method === "Log.entryAdded") {
            const e = message.params.entry;
            this.push({ time, level: e.level, text: e.text + (e.url ? ` (${e.url})` : "") });
        }
    }

    private push(entry: ConsoleEntry): void {
        this.console.push(entry);
        if (this.console.length > MaxConsoleEntries) {
            this.console.splice(0, this.console.length - MaxConsoleEntries);
        }
    }
}

export class CdpClient {
    private readonly sessions = new Map<string, PageSession>();

    constructor(private readonly port: number) { }

    public async targets(): Promise<PageTarget[]> {
        const json: any[] = await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${this.port}/json`, res => {
                let body = "";
                res.on("data", d => body += d);
                res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
            }).on("error", reject);
        });
        return json.filter(t => t.type === "page").map(t => ({ id: t.id, url: t.url, title: t.title, webSocketDebuggerUrl: t.webSocketDebuggerUrl }));
    }

    /*
     * Session of a page target, connected (and collecting console output) from the first use on.
     * */
    public async session(targetId?: string): Promise<PageSession> {
        const targets = await this.targets();
        for (const id of Array.from(this.sessions.keys())) {
            if (!targets.some(t => t.id === id)) {
                this.sessions.get(id)!.close();
                this.sessions.delete(id);
            }
        }
        let target = targetId ? targets.find(t => t.id === targetId) : undefined;
        if (!target) {
            if (targetId) {
                throw new Error(`no page target '${targetId}'; targets: ${targets.map(t => t.id).join(", ")}`);
            }
            target = await this.pickRenderedTarget(targets);
        }
        let session = this.sessions.get(target.id);
        if (!session) {
            session = new PageSession(target);
            this.sessions.set(target.id, session);
        }
        await session.connect();
        return session;
    }

    /*
     * Attaches to every page so that console output is collected for all of them.
     * */
    public async attachAll(): Promise<PageSession[]> {
        const targets = await this.targets();
        const sessions: PageSession[] = [];
        for (const t of targets) {
            try {
                sessions.push(await this.session(t.id));
            } catch {
                // a page that is being torn down
            }
        }
        return sessions;
    }

    public closeAll(): void {
        this.sessions.forEach(s => s.close());
        this.sessions.clear();
    }

    /*
     * The application preloads views in hidden pages; the default target is the first page that has rendered something.
     * */
    private async pickRenderedTarget(targets: PageTarget[]): Promise<PageTarget> {
        if (targets.length === 0) {
            throw new Error("no page targets: is the application running with RemoteDebuggingPort set?");
        }
        for (const t of targets) {
            try {
                const session = this.sessions.get(t.id) || new PageSession(t);
                this.sessions.set(t.id, session);
                await session.connect();
                const r = await session.send("Runtime.evaluate", { expression: "document.body ? document.body.textContent.trim().length : 0", returnByValue: true }, 5000);
                if (r.result.value > 0) {
                    return t;
                }
            } catch {
                // try the next one
            }
        }
        return targets[0];
    }
}

/*
 * Helpers evaluated inside a page. querySelector that also searches every shadow root (inner views).
 * */
export const PageHelpers = `
(function () {
    if (window.__rv) return;
    const roots = () => { const out = [document]; const walk = n => n.querySelectorAll("*").forEach(e => { if (e.shadowRoot) { out.push(e.shadowRoot); walk(e.shadowRoot); } }); walk(document); return out; };
    window.__rv = {
        query: s => { for (const r of roots()) { const e = r.querySelector(s); if (e) return e; } return null; },
        queryAll: s => roots().flatMap(r => Array.from(r.querySelectorAll(s))),
        views: () => (window.__reactview_hot__ && window.__reactview_hot__.views) ? window.__reactview_hot__.views() : [],
        text: e => (e.innerText || e.textContent || "").replace(/\\s+/g, " ").trim()
    };
})();`;
