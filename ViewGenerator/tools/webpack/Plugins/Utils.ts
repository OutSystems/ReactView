import { outputFileSync } from "fs-extra";
import { resolve } from "path";
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
    relativePath: string,
    namespace: string,
    entryFilter: (file: string) => boolean) {

    let fileEntries = files.filter(entryFilter).map(f => "/" + namespace + "/" + f).join("\n");
    outputFileSync(relativePath + entryName + extension + EntryExtension, (fileEntries || []).length > 0 ? fileEntries : "");
}

/*
 * Generates a manifest for the output.
 * */
export function generateManifest(
    seed: object,
    files: FileDescriptor[],
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
                    files = files.concat(Array.from(c.files));
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
                relativePath,
                namespace,
                f => f.endsWith(CssExtension));

            // JS
            generateEntryFile(files,
                name,
                JsExtension,
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
 * Gets the current directory.
 * */
export function getCurrentDirectory() {
    return resolve(".");
}

/*
 * Gets the filename from an array.
 * */
export function getFileName(relativePaths: Dictionary<string>, chunkData: any): string {
    const directory: string = relativePaths[chunkData.chunk.name];
    if (directory) {
        return directory + JsPlaceholder;
    }
    return OutputDirectoryDefault + JsChunkPlaceholder;
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