#!/usr/bin/env node
/*
 * ReactView MCP server: lets an agent develop against a running ReactView application.
 *
 *   node index.js --project <views.csproj> [--app-project <app.csproj>] [--configuration Debug] [--platform ARM64] [--dev-server-url http://localhost:8080] [--debugging-port 9222] [--agent-port 9223] [--ready-when <expression>]
 *
 * --project is the project whose views hot reload (the dev server builds it); --app-project the executable to run under
 * dotnet watch, when it is another project (plugins or views libraries), the views project otherwise. --ready-when is a
 * javascript expression evaluated in the application's pages: the application is ready for the agent once it is true
 * in one of them (e.g. the developer has logged in); reactview_start waits for it, and so does reactview_wait_for_ready
 * after a restart.
 *
 * Start the dev server and the application (dotnet watch) with reactview_start, then edit sources: the views hot reload
 * from the dev server, the C# through dotnet watch. reactview_wait_for_build tells when the sources are built,
 * reactview_views / reactview_dom / reactview_screenshot show the result, reactview_console what went wrong.
 *
 * The views are reached through the DevTools protocol (chromium). The native windows around them (Avalonia) through the
 * application's agent on --agent-port: reactview_windows, reactview_window_tree, reactview_window_screenshot.
 * */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execFileSync } from "child_process";
import * as http from "http";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { z } from "zod";
import { CdpClient, PageHelpers } from "./Cdp";
import { DevSession } from "./Processes";

function argument(name: string, fallback?: string): string | undefined {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}

const project = argument("project");
if (!project) {
    console.error("usage: index.js --project <views.csproj> [--app-project <app.csproj>] [--configuration Debug] [--platform ARM64] [--dev-server-url url] [--debugging-port 9222] [--agent-port 9223] [--ready-when expression]");
    process.exit(1);
}

const session = new DevSession({
    project: resolve(project),
    appProject: resolve(argument("app-project", project)!),
    configuration: argument("configuration", "Debug")!,
    platform: argument("platform", process.arch === "arm64" ? "ARM64" : "x64")!,
    devServerUrl: argument("dev-server-url", "http://localhost:8080")!.replace(/\/+$/, ""),
    debuggingPort: Number(argument("debugging-port", "9222")),
    agentPort: Number(argument("agent-port", "9223")),
    readyExpression: argument("ready-when") || undefined,
    dotnet: process.env.DOTNET_HOST_PATH || "dotnet"
});
const cdp = new CdpClient(session.options.debuggingPort);

const text = (value: unknown) => ({ content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });
const failure = (message: string) => ({ content: [{ type: "text" as const, text: message }], isError: true });

async function page(target?: string) {
    const s = await cdp.session(target);
    await s.send("Runtime.evaluate", { expression: PageHelpers });
    return s;
}

async function evaluate(expression: string, target?: string, timeoutMs: number = 15000): Promise<any> {
    const s = await page(target);
    const r = await s.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
    if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r.result.value;
}

/*
 * A request to the application's native agent (ReactViewControl.Avalonia DevAgent, dev mode): /windows, /tree, /screenshot.
 * */
function agentRequest(path: string, parameters: Record<string, string | number | undefined>, body?: object): Promise<{ contentType: string, body: Buffer }> {
    const query = Object.entries(parameters).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
    return new Promise((resolvePromise, reject) => {
        const request = http.request(`http://127.0.0.1:${session.options.agentPort}${path}${query ? "?" + query : ""}`, { method: body ? "POST" : "GET", headers: body ? { "content-type": "application/json" } : {} }, response => {
            const chunks: Buffer[] = [];
            response.on("data", c => chunks.push(c));
            response.on("end", () => {
                const body = Buffer.concat(chunks);
                if (response.statusCode !== 200) {
                    reject(new Error(`${path}: ${body.toString() || response.statusCode}`));
                } else {
                    resolvePromise({ contentType: response.headers["content-type"] || "", body });
                }
            });
        });
        request.on("error", e => reject(new Error(`the application's native agent did not answer on port ${session.options.agentPort} (${e.message}): is the application running in dev mode, with a ReactViewControl that has it?`)));
        request.setTimeout(30000, () => request.destroy(new Error("native agent request timed out")));
        request.end(body ? JSON.stringify(body) : undefined);
    });
}

/*
 * The pages of a covered window stop producing frames on macOS (the webviews are native views), and a screenshot
 * request then never answers: a capture that does not answer promptly is retried with the application's window
 * raised through the native agent, and the application that was in front gets the focus back.
 * */
async function captureScreenshot(target: string | undefined, parameters: object): Promise<Buffer> {
    const s = await page(target);
    const capture = async (timeoutMs: number) => { const r = await s.send("Page.captureScreenshot", parameters, timeoutMs); return Buffer.from(r.result?.data ?? r.data, "base64"); };
    try {
        return await capture(4000);
    } catch (e: any) {
        if (!String(e.message).includes("timed out")) {
            throw e;
        }
    }
    return withWindowRaised(() => capture(15000));
}

function frontmostApplication(): string | undefined {
    if (process.platform !== "darwin") {
        return undefined;
    }
    try {
        return execFileSync("osascript", ["-e", "tell application \"System Events\" to get name of first process whose frontmost is true"], { encoding: "utf8", timeout: 5000 }).trim() || undefined;
    } catch {
        return undefined;
    }
}

function bringToFront(application: string): void {
    try {
        execFileSync("osascript", ["-e", `tell application "System Events" to set frontmost of process "${application.replace(/"/g, "")}" to true`], { timeout: 5000 });
    } catch {
        // the application may be gone
    }
}

async function withWindowRaised<T>(action: () => Promise<T>): Promise<T> {
    const previous = frontmostApplication();
    try {
        await agentRequest("/activate", {});
    } catch (e: any) {
        throw new Error(`the page did not answer the screenshot request, its window is probably covered by other windows, and it could not be raised: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
    try {
        return await action();
    } finally {
        if (previous) {
            bringToFront(previous);
        }
    }
}

interface NativeWindow {
    index: number;
    title: string;
    pages: { id: string, x: number, y: number, width: number, height: number }[];
}

/*
 * The pages the DevTools protocol lists, by the page id the native agent knows them by (the fragment of their url).
 * */
async function pagesByNativeId(): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const t of await cdp.targets()) {
        const id = t.url.split("#")[1];
        if (id) {
            result.set(id, t.id);
        }
    }
    return result;
}

/*
 * The webviews paint on their own, outside Avalonia's rendering: captures each page shown in the window at the
 * requested scale, for the native agent to draw them into the window's screenshot.
 * */
async function capturePages(windowSpecification: string | undefined, scale: number): Promise<Record<string, string>> {
    const windows: NativeWindow[] = JSON.parse((await agentRequest("/windows", {})).body.toString());
    const window = windowSpecification === undefined || windowSpecification === "" ? windows[0]
        : windows.find(w => String(w.index) === windowSpecification) ?? windows.find(w => (w.title || "").toLowerCase().includes(windowSpecification.toLowerCase()));
    const targets = await pagesByNativeId();
    const pages: Record<string, string> = {};
    for (const p of window?.pages ?? []) {
        const target = targets.get(p.id);
        if (!target) {
            continue;
        }
        try {
            const viewport = await evaluate("({ width: window.innerWidth, height: window.innerHeight })", target, 5000);
            pages[p.id] = (await captureScreenshot(target, { format: "png", clip: { x: 0, y: 0, width: viewport.width, height: viewport.height, scale } })).toString("base64");
        } catch (e: any) {
            // the page's area stays as Avalonia renders it (blank)
            console.error(`[reactview] page ${p.id} not captured: ${e.message}`);
        }
    }
    return pages;
}

/*
 * A screenshot as the tool's result: saved to path when given (the result says where), returned inline otherwise.
 * */
function imageResult(png: Buffer, path: string | undefined, description: string) {
    if (path) {
        const file = resolve(path);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, png);
        return text(`${description} saved to ${file} (${png.length} bytes)`);
    }
    return { content: [{ type: "image" as const, data: png.toString("base64"), mimeType: "image/png" }] };
}

/*
 * Whether the application is ready for the agent: a page where the readiness expression is true, any page that has
 * rendered a view without one. A page being torn down (a restart) counts as not ready.
 * */
async function isReady(expression: string | undefined = session.options.readyExpression): Promise<boolean> {
    if (!await session.debuggingPortOpen()) {
        return false;
    }
    const targets = await cdp.targets().catch(() => []);
    for (const t of targets) {
        try {
            if (await evaluate(expression ? `!!(${expression})` : "window.__rv.text(document.body).length > 0", t.id, 5000)) {
                return true;
            }
        } catch {
            // not this page
        }
    }
    return false;
}

/*
 * Waits for the application to be ready, attaching to its pages (console collection) as they come: after a restart
 * under dotnet watch the pages are new ones.
 * */
async function waitForReady(timeoutMs: number, expression?: string): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    let attached = 0;
    do {
        if (await isReady(expression)) {
            await cdp.attachAll();
            return true;
        }
        if (Date.now() > attached + 10000) {
            await cdp.attachAll();
            attached = Date.now();
        }
        await new Promise(r => setTimeout(r, 1000));
    } while (Date.now() < deadline);
    return false;
}

function readiness(): string {
    return session.options.readyExpression ? `ready when: ${session.options.readyExpression}` : "ready when a view has rendered";
}

const server = new McpServer({ name: "reactview", version: "1.0.0" });

server.tool("reactview_start",
    "Starts the ReactView dev server (hot reload of views, stylesheets and C# bindings) and the application under dotnet watch (hot reload of C#). Idempotent. Returns when the first build is done and the application is ready: its views answer and, when the project configures a readiness condition (e.g. the developer has logged in), that condition holds; it waits for the developer up to timeoutSeconds, then returns the application as running but not ready (keep waiting with reactview_wait_for_ready). Otherwise returns with what is in the logs.",
    { devServer: z.boolean().optional().describe("start the dev server (default true)"), app: z.boolean().optional().describe("start the application (default true)"), timeoutSeconds: z.number().optional() },
    async ({ devServer = true, app = true, timeoutSeconds = 180 }) => {
        const deadline = Date.now() + timeoutSeconds * 1000;
        const report: string[] = [];
        if (devServer) {
            session.startDevServer();
            let status = null;
            while (Date.now() < deadline && !(status = await session.buildStatus()) ) {
                if (!session.devServer.running) break;
                await new Promise(r => setTimeout(r, 500));
            }
            if (!status) {
                return failure("dev server did not come up:\n" + session.devServer.tail(30).join("\n"));
            }
            status = await session.waitForBuild(deadline - Date.now());
            report.push(`dev server: ${status?.state} at ${session.options.devServerUrl}, serving ${(status?.assemblies || []).join(", ") || "nothing"}` + (status?.errors.length ? "\n" + status.errors.join("\n") : ""));
        }
        if (app) {
            session.startApp();
            const up = await session.waitForApp(deadline - Date.now());
            if (!up) {
                return failure("application did not expose its views:\n" + session.app.tail(30).join("\n"));
            }
            await new Promise(r => setTimeout(r, 3000)); // first render
            await cdp.attachAll();
            const ready = await waitForReady(Math.max(deadline - Date.now(), 1000));
            report.push(`application: running, DevTools protocol on port ${session.options.debuggingPort}, ${ready ? "ready" : "NOT READY yet (" + readiness() + "): the developer may have to act in the application, e.g. log in; wait with reactview_wait_for_ready"}`);
        }
        return text(report.join("\n"));
    });

server.tool("reactview_wait_for_ready",
    "Waits until the application is ready for the agent: a view has rendered and the project's readiness condition holds (e.g. the developer has logged in). Use after reactview_start reported the application as not ready, and after a restart under dotnet watch (rude edit: new interface members), when the developer has to log in again.",
    { timeoutSeconds: z.number().optional(), expression: z.string().optional().describe("readiness expression for this wait, instead of the project's") },
    async ({ timeoutSeconds = 300, expression }) => {
        if (!session.app.running) {
            return failure("application not running: call reactview_start");
        }
        const ready = await waitForReady(timeoutSeconds * 1000, expression);
        return ready ? text("ready") : failure(`not ready after ${timeoutSeconds} s (${expression ? "ready when: " + expression : readiness()})`);
    });

server.tool("reactview_stop", "Stops the application and the dev server started by reactview_start, and waits for them to go.", {}, async () => {
    cdp.closeAll();
    await session.stop();
    return text("stopped");
});

server.tool("reactview_status",
    "State of the session: dev server build (errors, warnings, C# bindings generation), whether the application runs and answers.",
    {},
    async () => text({
        devServer: { running: session.devServer.running, build: await session.buildStatus() },
        app: { running: session.app.running, devToolsReachable: await session.debuggingPortOpen(), ready: await isReady(), readiness: readiness(), lastLines: session.app.tail(5) }
    }));

server.tool("reactview_wait_for_build",
    "After editing sources: waits until the dev server has rebuilt (views and C# bindings) and returns the build status. Follow with reactview_status to see whether dotnet watch applied C# changes.",
    { timeoutSeconds: z.number().optional() },
    async ({ timeoutSeconds = 60 }) => {
        await new Promise(r => setTimeout(r, 500)); // let the file watcher notice the edit
        const status = await session.waitForBuild(timeoutSeconds * 1000);
        if (!status) {
            return failure("dev server not reachable");
        }
        await new Promise(r => setTimeout(r, 1000)); // let the application apply the update
        return status.state === "error" ? failure(JSON.stringify(status, null, 2)) : text(status);
    });

server.tool("reactview_logs",
    "Recent output of the dev server or of dotnet watch / the application.",
    { source: z.enum(["devserver", "app"]), lines: z.number().optional() },
    async ({ source, lines = 60 }) => text((source === "devserver" ? session.devServer : session.app).tail(lines).join("\n") || "(empty)"));

server.tool("reactview_views",
    "Lists the pages of the application (targets for the other tools) and the ReactView views each one hosts: the main view and its inner views, with their component names.",
    {},
    async () => {
        const targets = await cdp.targets();
        const result = [];
        for (const t of targets) {
            try {
                const info = await evaluate("({ views: window.__rv.views(), text: window.__rv.text(document.body).slice(0, 160) })", t.id, 5000);
                result.push({ target: t.id, rendered: info.text.length > 0, views: info.views, text: info.text });
            } catch (e: any) {
                result.push({ target: t.id, error: e.message });
            }
        }
        return text(result);
    });

server.tool("reactview_screenshot",
    "PNG screenshot of a page (default: the rendered one), of the first element matching selector when given (inner views included), at scale times the page's device pixel ratio. Saved to path when given, returned inline otherwise.",
    { target: z.string().optional(), selector: z.string().optional(), scale: z.number().optional(), path: z.string().optional().describe("file to save the PNG to") },
    async ({ target, selector, scale = 1, path }) => {
        try {
            let clip: { x: number, y: number, width: number, height: number, scale: number } | undefined;
            if (selector) {
                const box = await evaluate(`(function(){ const e = window.__rv.query(${JSON.stringify(selector)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`, target);
                if (!box) {
                    return failure(`no element matches ${selector}`);
                }
                clip = { ...box, scale };
            }
            const png = await captureScreenshot(target, clip ? { format: "png", clip, captureBeyondViewport: true } : { format: "png" });
            return imageResult(png, path, `screenshot of ${selector || "the page"}`);
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_windows",
    "The native (Avalonia) windows of the application, the active one first: index and title (both usable as window for the other native tools), size in device independent pixels, render scaling, and the pages (web views) each one shows with their area.",
    {},
    async () => {
        try {
            return text(JSON.parse((await agentRequest("/windows", {})).body.toString()));
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_window_tree",
    "Visual tree of a native window (default: the active one), or of one of its controls (name: the control's Name, type: its type name): control type, name, classes, text, position and size relative to the window, down to depth levels. Hidden subtrees are left out. Use it to find what to screenshot or where things are; the web views appear as a single control, see them with reactview_dom.",
    { window: z.string().optional().describe("index or title substring"), name: z.string().optional(), type: z.string().optional(), depth: z.number().optional() },
    async ({ window, name, type, depth }) => {
        try {
            return text(JSON.parse((await agentRequest("/tree", { window, name, type, depth })).body.toString()));
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_window_screenshot",
    "PNG of a native window (default: the active one) as rendered by Avalonia, web views included, or of one of its controls (name / type, as in reactview_window_tree), at scale times the window's render scaling. Saved to path when given, returned inline otherwise. Does not need the window to be unobscured on screen.",
    { window: z.string().optional().describe("index or title substring"), name: z.string().optional(), type: z.string().optional(), scale: z.number().optional(), path: z.string().optional().describe("file to save the PNG to") },
    async ({ window, name, type, scale = 1, path }) => {
        try {
            const pages = await capturePages(window, scale);
            const r = await agentRequest("/screenshot", { window, name, type, scale }, { pages });
            return imageResult(r.body, path, `screenshot of ${name || type || "the window"}`);
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_evaluate",
    "Evaluates a JavaScript expression in a page and returns its value (JSON). window.__rv.query(selector) and window.__rv.queryAll(selector) search inner views (shadow roots) too.",
    { expression: z.string(), target: z.string().optional() },
    async ({ expression, target }) => {
        try {
            return text(await evaluate(expression, target));
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_dom",
    "Text and outer HTML of the elements matching a CSS selector, searching inner views (shadow roots) too. Without selector: the text of the whole page.",
    { selector: z.string().optional(), target: z.string().optional(), maxLength: z.number().optional() },
    async ({ selector, target, maxLength = 4000 }) => {
        const expression = selector
            ? `window.__rv.queryAll(${JSON.stringify(selector)}).slice(0, 20).map(e => ({ text: window.__rv.text(e), html: e.outerHTML.slice(0, ${maxLength}) }))`
            : `window.__rv.text(document.body).slice(0, ${maxLength})`;
        try {
            return text(await evaluate(expression, target));
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_click",
    "Clicks the first element matching a CSS selector (inner views included).",
    { selector: z.string(), target: z.string().optional() },
    async ({ selector, target }) => {
        try {
            const found = await evaluate(`(function(){ const e = window.__rv.query(${JSON.stringify(selector)}); if (!e) return false; e.click(); return true; })()`, target);
            return found ? text(`clicked ${selector}`) : failure(`no element matches ${selector}`);
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_type",
    "Sets the value of the first input or textarea matching a CSS selector and dispatches input and change events, the way React expects.",
    { selector: z.string(), value: z.string(), target: z.string().optional() },
    async ({ selector, value, target }) => {
        try {
            const found = await evaluate(`(function(){ const e = window.__rv.query(${JSON.stringify(selector)}); if (!e) return false;
                const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), "value"); if (setter && setter.set) setter.set.call(e, ${JSON.stringify(value)}); else e.value = ${JSON.stringify(value)};
                e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`, target);
            return found ? text(`typed into ${selector}`) : failure(`no element matches ${selector}`);
        } catch (e: any) {
            return failure(e.message);
        }
    });

server.tool("reactview_reload",
    "Loads the views again from the current sources (component and inner views recreated, native state kept). For changes hot reload could not apply, such as plugin modules. Returns when the page has rendered again.",
    { target: z.string().optional(), timeoutSeconds: z.number().optional() },
    async ({ target, timeoutSeconds = 30 }) => {
        try {
            await evaluate("window.__reactview_hot__ ? (window.__reactview_hot__.reload(), true) : false", target);
        } catch (e: any) {
            return failure(e.message);
        }
        cdp.closeAll(); // the page's javascript context is replaced
        const deadline = Date.now() + timeoutSeconds * 1000;
        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 1000));
            try {
                const info = await evaluate("({ views: window.__rv.views(), text: window.__rv.text(document.body).slice(0, 120) })", undefined, 5000);
                if (info.text.length > 0) {
                    return text(info);
                }
            } catch {
                // not back yet
            }
        }
        return failure("the view did not render again within the timeout; see reactview_console and reactview_logs");
    });

server.tool("reactview_console",
    "Console messages, exceptions and failed resource loads collected from the pages since the last call (or all kept, with clear=false).",
    { target: z.string().optional(), clear: z.boolean().optional(), levels: z.array(z.string()).optional().describe("e.g. [\"error\", \"exception\", \"warning\"]") },
    async ({ target, clear = true, levels }) => {
        const sessions = target ? [await cdp.session(target)] : await cdp.attachAll();
        const entries = sessions.flatMap(s => s.console.filter(e => !levels || levels.includes(e.level)).map(e => ({ target: s.target.id, ...e })));
        if (clear) {
            sessions.forEach(s => s.console.length = 0);
        }
        return text(entries.length ? entries : "(no console output)");
    });

// the client went away (closed our stdin): the processes it started go with it
process.stdin.on("end", () => { session.kill(); process.exit(0); });
process.stdin.on("close", () => { session.kill(); process.exit(0); });
process.on("SIGTERM", () => { session.kill(); process.exit(0); });
process.on("SIGINT", () => { session.kill(); process.exit(0); });

server.connect(new StdioServerTransport()).catch(e => { console.error(e); process.exit(1); });
