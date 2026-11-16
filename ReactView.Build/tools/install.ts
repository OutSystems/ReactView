/*
 * Installs the Node dependencies of the ReactView build tooling into a per machine folder.
 *
 * Usage: node install.js --source <dir with package.json and package-lock.json> --target <install dir> [--min-node <major>]
 *
 * The install is done into a temporary sibling folder and moved into place once complete, so a build that is
 * interrupted never leaves a half installed folder behind and two builds racing for the same install do not
 * step on each other: whoever moves first wins, the other discards its copy.
 */
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const InstalledMarker = ".reactview-installed";
const LockFiles = ["package.json", "package-lock.json"];

function fail(message: string): never {
    console.error(`ReactView.Build: ${message}`);
    process.exit(1);
}

function getArgument(name: string): string | undefined {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : undefined;
}

function checkNodeVersion(minimumMajor: number): void {
    const major = Number(process.versions.node.split(".")[0]);
    if (major < minimumMajor) {
        fail(`Node.js ${minimumMajor} or later is required, found ${process.versions.node} (${process.execPath}).`);
    }
}

function findNpmCli(): string | undefined {
    const nodeDirectory = path.dirname(process.execPath);
    const candidates = [
        path.join(nodeDirectory, "node_modules", "npm", "bin", "npm-cli.js"), // windows layout
        path.join(nodeDirectory, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js") // unix layout
    ];
    return candidates.find(c => fs.existsSync(c));
}

function runNpmCi(directory: string): number {
    const args = ["ci", "--omit=dev", "--no-audit", "--no-fund", "--loglevel=error"];
    const npmCli = findNpmCli();

    const result = npmCli
        ? spawnSync(process.execPath, [npmCli, ...args], { cwd: directory, stdio: "inherit" })
        : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, { cwd: directory, stdio: "inherit", shell: true });

    if (result.error) {
        fail(`could not run npm: ${result.error.message}`);
    }
    return result.status ?? 1;
}

function install(source: string, target: string): void {
    const marker = path.join(target, "node_modules", InstalledMarker);
    if (fs.existsSync(marker)) {
        return;
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    const staging = fs.mkdtempSync(path.join(path.dirname(target), "installing-"));

    try {
        for (const file of LockFiles) {
            fs.copyFileSync(path.join(source, file), path.join(staging, file));
        }

        console.log(`ReactView.Build: installing tools into ${target}`);
        const status = runNpmCi(staging);
        if (status !== 0) {
            fail(`npm ci failed with exit code ${status}.`);
        }

        fs.writeFileSync(path.join(staging, "node_modules", InstalledMarker), new Date().toISOString());

        try {
            fs.renameSync(staging, target);
        } catch (error) {
            if (!fs.existsSync(marker)) {
                throw error;
            }
            // another build completed the same install in the meantime
            fs.rmSync(staging, { recursive: true, force: true });
        }
    } catch (error) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw error;
    }
}

const source = getArgument("source");
const target = getArgument("target");
if (!source || !target) {
    fail("usage: install.js --source <dir> --target <dir> [--min-node <major>]");
}

checkNodeVersion(Number(getArgument("min-node") || "0"));
install(path.resolve(source), path.resolve(target));
