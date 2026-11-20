import { outputFileSync } from "fs-extra";
import { delimiter, dirname, join, resolve } from "path";
import TypeScript from 'typescript';
import { FileDescriptor } from "webpack-manifest-plugin/dist/helpers";
import {
    CssExtension,
    DataTestIdAttributes,
    EntryExtension,
    JsChunkPlaceholder,
    JsExtension,
    JsPlaceholder,
    OutputDirectoryDefault
} from "./Resources";

export type Dictionary<T> = { [key: string]: T };

/*
 * Generates an entry file.
 * */
function generateEntryFile(
    files: string[],
    entryName: string,
    extension: string,
    outputPath: string,
    relativePath: string,
    namespace: string,
    entryFilter: (file: string) => boolean) {

    let fileEntries = files.filter(entryFilter).map(f => "/" + namespace + "/" + f).join("\n");
    outputFileSync(join(outputPath, relativePath + entryName + extension + EntryExtension), (fileEntries || []).length > 0 ? fileEntries : "");
}

/*
 * Generates a manifest for the output.
 * */
export function generateManifest(
    seed: object,
    files: FileDescriptor[],
    outputPath: string,
    relativePaths: Dictionary<string>,
    namespaces: Dictionary<string>) {

    let entries = [];

    files.forEach(f => {
        if (f.chunk) {
            (f.chunk["_groups"] || []).forEach(g => {
                if (entries.indexOf(g) < 0) {
                    entries.push(g);
                }
            });
        }
    });

    let entryArrayManifest = entries.reduce((acc, entry) => {
        let name: string = (entry.options || {}).name || (entry.runtimeChunk || {}).name;
        let files: string[] = [];
        if (entry.chunks) {
            entry.chunks.forEach(c => {
                if (c.files) {
                    // dev server: the hot updates of a rebuilt chunk are files of it too, but only the hot runtime loads them
                    files = files.concat(Array.from(c.files as Iterable<string>).filter(f => !f.includes(".hot-update.")));
                }
            });
        }
        if (name) {
            const relativePath = relativePaths[name];
            const namespace = namespaces[name];

            // CSS
            generateEntryFile(files,
                name,
                CssExtension,
                outputPath,
                relativePath,
                namespace,
                f => f.endsWith(CssExtension));

            // JS
            generateEntryFile(files,
                name,
                JsExtension,
                outputPath,
                relativePath,
                namespace,
                f => f.endsWith(JsExtension) && !f.endsWith("/" + name + JsExtension));

            return { ...acc, [name]: files };
        }

        return acc;
    }, seed);

    return entryArrayManifest;
}

/*
 * Gets the directories webpack loaders are resolved from: the tools install the build targets point at through
 * NODE_PATH, falling back to a node_modules next to the configurations (local development of the tooling).
 * */
export function getLoaderDirectories(): string[] {
    const fromEnvironment = (process.env.NODE_PATH || "").split(delimiter).filter(p => p.length > 0);
    return fromEnvironment.length > 0 ? fromEnvironment : [join(__dirname, "..", "..", "node_modules")];
}

/*
 * Gets the version of the filesystem cache. The cache stores absolute paths of the loaders, so it is bound to the
 * tools install that produced it.
 * */
export function getCacheVersion(): string {
    return getLoaderDirectories().join(delimiter);
}

/*
 * Gets the directory the bundles are written to: the one the build passes in (under the project's obj folder),
 * otherwise the current directory.
 * */
export function getOutputPath(env: { outputPath?: string }): string {
    return resolve(sanitizeCommandLineParam(env.outputPath) || ".");
}

/*
 * Gets the directory of the filesystem cache, a sibling of the output directory so that cleaning the outputs
 * keeps the cache.
 * */
export function getCachePath(outputPath: string): string {
    return join(dirname(outputPath), "cache");
}

/*
 * Gets the current directory.
 * */
export function getCurrentDirectory() {
    return resolve(".");
}

/*
 * Gets the filename from an array.
 * */
export function getFileName(relativePaths: Dictionary<string>, chunkData: any, chunkPlaceholder: string = JsChunkPlaceholder): string {
    const directory: string = relativePaths[chunkData.chunk.name];
    if (directory) {
        return directory + JsPlaceholder;
    }
    return OutputDirectoryDefault + chunkPlaceholder;
}

/*
 * Sanitizes a command-line parameter
 * */
export function sanitizeCommandLineParam(parameter: string): string {
    return !parameter ? "" : parameter.replaceAll("'", "");
}

/*
 * Removes data-test-id attribute
 * */
export function removeDataTestIdTransformer<T extends TypeScript.Node>(): (context: TypeScript.TransformationContext) => (node: T) => TypeScript.Node {
    return context => {
        const visit: TypeScript.Visitor = node => {
            if (TypeScript.isJsxAttribute(node)) {
                if (DataTestIdAttributes.indexOf(node.name.getText()) > -1) {
                    return undefined;
                }
            }
            return TypeScript.visitEachChild(node, visit, context);
        };
        return node => TypeScript.visitNode(node, visit);
    };
}