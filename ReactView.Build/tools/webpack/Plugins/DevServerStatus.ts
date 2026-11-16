import { Compiler, MultiStats, Stats } from "webpack";

/*
 * Build status of the dev server, exposed over HTTP so that tools (and agents) can tell whether the running
 * application reflects the sources on disk:
 *
 *   GET /__reactview/status   current state as JSON
 *   GET /__reactview/events   server-sent events stream, one "status" event per state change
 * */

export interface BuildStatus {
    state: "building" | "ok" | "error";
    hash?: string;
    builtAt?: string;
    durationMs?: number;
    errors: string[];
    warnings: string[];
}

const StatusPath = "/__reactview/status";
const EventsPath = "/__reactview/events";

let status: BuildStatus = { state: "building", errors: [], warnings: [] };
let buildStartedAt: number = Date.now();
const listeners = new Set<(status: BuildStatus) => void>();

function publish(next: BuildStatus): void {
    status = next;
    listeners.forEach(l => l(status));
}

function formatMessages(stats: Stats | MultiStats, kind: "errors" | "warnings"): string[] {
    return stats.toJson({ all: false, [kind]: true, errorDetails: false })[kind]?.map(e => e.message) || [];
}

export function watchCompiler(compiler: Compiler | { hooks: Compiler["hooks"] }): void {
    compiler.hooks.invalid.tap("ReactViewDevServerStatus", () => {
        buildStartedAt = Date.now();
        publish({ state: "building", errors: [], warnings: [] });
    });
    (compiler.hooks.done as any).tap("ReactViewDevServerStatus", (stats: Stats | MultiStats) => {
        const errors = formatMessages(stats, "errors");
        publish({
            state: errors.length > 0 ? "error" : "ok",
            hash: stats.hash,
            builtAt: new Date().toISOString(),
            durationMs: Date.now() - buildStartedAt,
            errors,
            warnings: formatMessages(stats, "warnings")
        });
    });
}

/*
 * Express style middleware serving the two endpoints.
 * */
export function statusMiddleware(request: any, response: any, next: () => void): void {
    const path: string = (request.url || "").split("?")[0];

    if (path === StatusPath) {
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Cache-Control", "no-store");
        response.end(JSON.stringify(status));
        return;
    }

    if (path === EventsPath) {
        response.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-store",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        });
        const send = (s: BuildStatus) => response.write(`event: status\ndata: ${JSON.stringify(s)}\n\n`);
        send(status);
        listeners.add(send);
        request.on("close", () => listeners.delete(send));
        return;
    }

    next();
}
