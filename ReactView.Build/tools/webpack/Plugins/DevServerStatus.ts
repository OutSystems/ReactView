import { Compiler, MultiCompiler, MultiStats, Stats } from "webpack";

/*
 * Build status of the dev server, exposed over HTTP so that tools (and agents) can tell whether the running
 * application reflects the sources on disk:
 *
 *   GET /__reactview/status   current state as JSON
 *   GET /__reactview/events   server-sent events stream, one "status" event per state change
 *
 * The dev server runs one webpack build per project it serves (and one per default stylesheets and workers set of
 * those projects); the status lists them with the assembly each one belongs to and its own hash. The loader takes the
 * hot reload runtime from the views builds and reloads the views when a plugins build changes.
 * */

export type BuildKind = "views" | "plugins" | "stylesheets" | "workers";

export interface BuildInfo {
    name: string; // the webpack configuration name
    assembly: string; // served under /<assembly>/
    kind: BuildKind;
    hash?: string;
    state: "building" | "ok" | "error";
}

export interface BuildStatus {
    state: "building" | "ok" | "error";
    assemblies: string[]; // the assemblies this server builds and serves (under /<assembly>/)
    builds: BuildInfo[];
    hash?: string;
    builtAt?: string;
    durationMs?: number;
    errors: string[];
    warnings: string[];
    bindings?: BindingsStatus; // C# bindings generation, when the dev server is doing it
}

export interface BindingsStatus {
    state: "ok" | "error";
    durationMs: number;
    errors: string[];
}

const StatusPath = "/__reactview/status";
const EventsPath = "/__reactview/events";

let status: BuildStatus = { state: "building", assemblies: [], builds: [], errors: [], warnings: [] };
let buildStartedAt: number = Date.now();
const listeners = new Set<(status: BuildStatus) => void>();
const bindingsByAssembly = new Map<string, BindingsStatus>();

function publish(next: Partial<BuildStatus>): void {
    status = { ...status, ...next };
    listeners.forEach(l => l(status));
}

/*
 * Declares the builds the server runs, before the first one completes.
 * */
export function setServedBuilds(builds: { name: string, assembly: string, kind: BuildKind }[]): void {
    status = {
        ...status,
        assemblies: Array.from(new Set(builds.map(b => b.assembly))),
        builds: builds.map(b => ({ ...b, state: "building" }))
    };
}

function formatMessages(stats: Stats | MultiStats, kind: "errors" | "warnings"): string[] {
    return stats.toJson({ all: false, [kind]: true, errorDetails: false })[kind]?.map(e => e.message) || [];
}

function updateBuilds(stats: Stats | MultiStats): BuildInfo[] {
    const children: Stats[] = (stats as MultiStats).stats || [stats as Stats];
    return status.builds.map(build => {
        const child = children.find(c => c.compilation.compiler.name === build.name);
        if (!child) {
            return build;
        }
        return { ...build, hash: child.hash, state: child.hasErrors() ? "error" : "ok" };
    });
}

export function watchCompiler(compiler: Compiler | MultiCompiler): void {
    compiler.hooks.invalid.tap("ReactViewDevServerStatus", () => {
        buildStartedAt = Date.now();
        publish({ state: "building", errors: [], warnings: [] });
    });
    (compiler.hooks.done as any).tap("ReactViewDevServerStatus", (stats: Stats | MultiStats) => {
        const errors = formatMessages(stats, "errors");
        publish({
            state: errors.length > 0 ? "error" : "ok",
            builds: updateBuilds(stats),
            hash: stats.hash,
            builtAt: new Date().toISOString(),
            durationMs: Date.now() - buildStartedAt,
            errors,
            warnings: formatMessages(stats, "warnings")
        });
    });
}

/*
 * Bindings generation of one views project; the status carries the aggregate of all of them.
 * */
export function reportBindings(assembly: string, bindings: BindingsStatus): void {
    bindingsByAssembly.set(assembly, bindings);
    const all = Array.from(bindingsByAssembly.entries());
    publish({
        bindings: {
            state: all.some(([, b]) => b.state === "error") ? "error" : "ok",
            durationMs: all.reduce((total, [, b]) => total + b.durationMs, 0),
            errors: all.flatMap(([name, b]) => b.errors.map(e => `${name}: ${e}`))
        }
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
