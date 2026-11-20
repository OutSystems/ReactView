import { ChildProcess, spawn } from "child_process";
import * as http from "http";
import { dirname } from "path";

/*
 * The two processes of a ReactView development session: the dev server (dotnet msbuild -t:ReactViewDevServer) and
 * the application under "dotnet watch", each with a bounded log.
 * */

export interface SessionOptions {
    project: string; // absolute path of the views csproj, the one the dev server builds
    appProject: string; // absolute path of the executable csproj (dotnet watch run), the views one when they are the same
    configuration: string;
    platform: string;
    devServerUrl: string;
    // javascript expression, evaluated in the application's pages, that tells when the application is ready for the
    // agent (e.g. the developer has logged in); none: ready as soon as a view has rendered
    readyExpression?: string;
    debuggingPort: number;
    // port of the application's native agent (DevAgent in ReactViewControl.Avalonia): windows, visual tree, native screenshots
    agentPort: number;
    dotnet: string;
}

export interface BuildStatus {
    state: "building" | "ok" | "error";
    hash?: string;
    builtAt?: string;
    durationMs?: number;
    errors: string[];
    warnings: string[];
    assemblies?: string[]; // served under /<assembly>/
    builds?: { name: string, assembly: string, kind: string, hash?: string, state: string }[];
    bindings?: { state: "ok" | "error", durationMs: number, errors: string[] };
}

const MaxLogLines = 400;

export class ManagedProcess {
    public process: ChildProcess | null = null;
    public readonly log: string[] = [];
    public exitCode: number | null = null;

    constructor(public readonly name: string) { }

    public start(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): void {
        if (this.running) {
            return;
        }
        this.log.length = 0;
        this.exitCode = null;
        const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
        const onData = (d: Buffer) => d.toString().split("\n").filter(l => l.trim()).forEach(l => this.append(l));
        child.stdout!.on("data", onData);
        child.stderr!.on("data", onData);
        child.on("exit", code => { this.exitCode = code; this.append(`[${this.name}] exited with code ${code}`); this.process = null; });
        child.on("error", e => { this.append(`[${this.name}] failed to start: ${e.message}`); this.process = null; });
        this.process = child;
    }

    public get running(): boolean {
        return this.process !== null && this.process.exitCode === null;
    }

    /*
     * Asks the whole tree to stop (msbuild -> node, dotnet watch -> app -> browser helpers): the process group.
     * */
    public stop(): void {
        if (this.process) {
            this.groupId = this.process.pid!;
            this.signal("SIGTERM");
            this.process = null;
        }
    }

    /*
     * Stops the tree and waits for it to go, up to timeoutMs; what is still there then is killed (webpack-dev-server
     * has been seen to survive a SIGTERM).
     * */
    public async stopAndWait(timeoutMs: number = 5000): Promise<void> {
        this.stop();
        const deadline = Date.now() + timeoutMs;
        while (this.groupAlive() && Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 200));
        }
        this.signal("SIGKILL");
    }

    /*
     * Stops the tree without waiting: for when this process is going away itself.
     * */
    public kill(): void {
        this.stop();
        this.signal("SIGKILL");
    }

    private groupId: number | null = null;

    private signal(signal: NodeJS.Signals): void {
        if (this.groupId === null) {
            return;
        }
        try { process.kill(-this.groupId, signal); } catch { /* the group is gone */ }
        try { process.kill(this.groupId, signal); } catch { /* already gone */ }
    }

    private groupAlive(): boolean {
        if (this.groupId === null) {
            return false;
        }
        try {
            process.kill(-this.groupId, 0);
            return true;
        } catch {
            return false;
        }
    }

    public tail(lines: number): string[] {
        return this.log.slice(-lines);
    }

    private append(line: string): void {
        this.log.push(line);
        if (this.log.length > MaxLogLines) {
            this.log.splice(0, this.log.length - MaxLogLines);
        }
    }
}

export class DevSession {
    public readonly devServer = new ManagedProcess("dev server");
    public readonly app = new ManagedProcess("app");

    constructor(public readonly options: SessionOptions) { }

    public startDevServer(): void {
        const o = this.options;
        this.devServer.start(o.dotnet,
            ["msbuild", o.project, "-t:ReactViewDevServer", `-p:Configuration=${o.configuration}`, `-p:Platform=${o.platform}`, `-p:ReactViewDevServerUrl=${o.devServerUrl}`, "-nologo", "-v:m"],
            dirname(o.project), process.env);
    }

    public startApp(): void {
        const o = this.options;
        this.app.start(o.dotnet,
            ["watch", "--non-interactive", "--project", o.appProject, "run", "-c", o.configuration, `--property:Platform=${o.platform}`],
            dirname(o.appProject),
            { ...process.env, DEV_SERVER_URI: o.devServerUrl, REACTVIEW_AGENT_PORT: String(o.agentPort), DOTNET_WATCH_RESTART_ON_RUDE_EDIT: "true", DOTNET_WATCH_SUPPRESS_EMOJIS: "true" });
    }

    /*
     * Stops the application and the dev server, waiting for them to go (reactview_stop).
     * */
    public async stop(): Promise<void> {
        await Promise.all([this.app.stopAndWait(), this.devServer.stopAndWait()]);
    }

    /*
     * Kills both at once: the client went away, so does this process.
     * */
    public kill(): void {
        this.app.kill();
        this.devServer.kill();
    }

    public buildStatus(timeoutMs: number = 3000): Promise<BuildStatus | null> {
        return new Promise(resolve => {
            const req = http.get(`${this.options.devServerUrl}/__reactview/status`, res => {
                let body = "";
                res.on("data", d => body += d);
                res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
            });
            req.on("error", () => resolve(null));
            req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null); });
        });
    }

    public async waitForBuild(timeoutMs: number): Promise<BuildStatus | null> {
        const deadline = Date.now() + timeoutMs;
        let status: BuildStatus | null = null;
        while (Date.now() < deadline) {
            status = await this.buildStatus();
            if (status && status.state !== "building") {
                return status;
            }
            await new Promise(r => setTimeout(r, 300));
        }
        return status;
    }

    public debuggingPortOpen(): Promise<boolean> {
        return new Promise(resolve => {
            const req = http.get(`http://127.0.0.1:${this.options.debuggingPort}/json/version`, res => { res.resume(); resolve(res.statusCode === 200); });
            req.on("error", () => resolve(false));
            req.setTimeout(2000, () => { req.destroy(); resolve(false); });
        });
    }

    public async waitForApp(timeoutMs: number): Promise<boolean> {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (await this.debuggingPortOpen()) {
                return true;
            }
            if (!this.app.running) {
                return false;
            }
            await new Promise(r => setTimeout(r, 500));
        }
        return false;
    }
}
