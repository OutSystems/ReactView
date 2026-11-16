import { spawn } from "child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { Compiler } from "webpack";
import { reportBindings } from "./DevServerStatus";

/*
 * Dev server: regenerates the C# bindings of the views after every build, into the folder the regular build uses
 * ($(IntermediateOutputPath)reactview/cs), so that "dotnet watch" sees a changed binding like any other C# edit and
 * hot reloads it. Files are only written when their content changed, nothing else is touched.
 * */
export interface BindingsGeneratorOptions {
    projectDirectory: string; // where ts2lang.json lives
    generatedPath: string; // destination of the generated C#
    ts2langScript: string; // @outsystems/ts2lang/ts2lang-main.js
    template: string; // compiled ViewGenerator.js
}

export class BindingsGeneratorPlugin {

    private running: Promise<void> | null = null;
    private pending: boolean = false;

    constructor(private readonly options: BindingsGeneratorOptions) { }

    public apply(compiler: Compiler): void {
        compiler.hooks.done.tap("ReactViewBindingsGenerator", () => { this.schedule(); });
    }

    private schedule(): void {
        if (this.running) {
            this.pending = true;
            return;
        }
        this.running = this.generate().finally(() => {
            this.running = null;
            if (this.pending) {
                this.pending = false;
                this.schedule();
            }
        });
    }

    private async generate(): Promise<void> {
        const startedAt = Date.now();
        const staging = this.options.generatedPath + ".generating";
        rmSync(staging, { recursive: true, force: true });
        mkdirSync(staging, { recursive: true });

        const errors = await this.runGenerator(staging);
        if (errors.length === 0) {
            const changed = syncDirectories(staging, this.options.generatedPath);
            if (changed.length > 0) {
                console.log(`[ReactView] bindings updated: ${changed.join(", ")}`);
            }
        }
        rmSync(staging, { recursive: true, force: true });

        reportBindings({ state: errors.length > 0 ? "error" : "ok", durationMs: Date.now() - startedAt, errors });
    }

    private runGenerator(destination: string): Promise<string[]> {
        return new Promise(resolve => {
            const child = spawn(process.execPath,
                [this.options.ts2langScript, "-f", join(this.options.projectDirectory, "ts2lang.json"), "-t", this.options.template],
                { cwd: this.options.projectDirectory, env: { ...process.env, REACTVIEW_GENERATED_PATH: destination } });
            let output = "";
            child.stdout.on("data", d => output += d);
            child.stderr.on("data", d => output += d);
            child.on("error", e => resolve([`bindings generator could not start: ${e.message}`]));
            child.on("close", code => resolve(code === 0 ? [] : [output.trim() || `bindings generator exited with code ${code}`]));
        });
    }
}

/*
 * Makes `target` mirror `source`, writing only the files whose content differs. Returns the relative paths touched.
 * */
function syncDirectories(source: string, target: string): string[] {
    const changed: string[] = [];
    const sourceFiles = new Set(listFiles(source));

    for (const file of sourceFiles) {
        const content = readFileSync(join(source, file));
        const targetFile = join(target, file);
        if (!existsSync(targetFile) || !content.equals(readFileSync(targetFile))) {
            mkdirSync(join(target, file, ".."), { recursive: true });
            writeFileSync(targetFile, content);
            changed.push(file);
        }
    }
    if (existsSync(target)) {
        for (const file of listFiles(target)) {
            if (!sourceFiles.has(file)) {
                rmSync(join(target, file));
                changed.push(file + " (removed)");
            }
        }
    }
    return changed;
}

function listFiles(directory: string, root: string = directory): string[] {
    if (!existsSync(directory)) {
        return [];
    }
    return readdirSync(directory).flatMap(name => {
        const path = join(directory, name);
        return statSync(path).isDirectory() ? listFiles(path, root) : [relative(root, path)];
    });
}
