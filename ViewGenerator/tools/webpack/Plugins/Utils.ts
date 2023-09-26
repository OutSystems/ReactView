﻿import Chalk from "chalk";
import { outputFileSync } from "fs-extra";
import { resolve } from "path";
import { Issue } from "fork-ts-checker-webpack-plugin/lib/issue";
import { FileDescriptor } from "webpack-manifest-plugin/dist/helpers";

import { CssExtension, EntryExtension, JsExtension, JsPlaceholder, OutputDirectoryDefault } from "./Resources";

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
                    files = files.concat(c.files);
                }
            });
        }
        if (name) {
            var relativePath = relativePaths[name];
            var namespace = namespaces[name];

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
 * Custom typescript error formater for Visual Studio.
 * */
export function customErrorFormatter(issue: Issue, enableColors: boolean, namespace: string) {
    const colors = new Chalk.Instance();
    const defaultSeverity = "error";
    const defaultColor = colors.bold.red;
    const locationColor = colors.bold.cyan;
    const codeColor = colors.grey;

    if (issue.file && issue.location.start.line && issue.location.start.column) {

        // e.g. file.ts(17,20): error TS0168: The variable 'foo' is declared but never used.
        return locationColor(issue.file + "(" + issue.location.start.line + "," + issue.location.start.column + ")") +
            defaultColor(":") + " " +
            defaultColor(defaultSeverity.toUpperCase()) + " " +
            codeColor("TS" + issue.code) +
            defaultColor(":") + " " +
            defaultColor(issue.message);
    }

    if (!issue.file) {
        // some messages do not have file specified, although logger needs it
        (issue as any).file = namespace;
    }

    // e.g. error TS6053: File 'file.ts' not found.
    return defaultColor(defaultSeverity.toUpperCase()) + " " +
        codeColor("TS" + issue.code) +
        defaultColor(":") + " " +
        defaultColor(issue.message);
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
export function getFileName(relativePaths: Dictionary<string>, chunkData: any) {
    return (relativePaths[chunkData.chunk.name] || OutputDirectoryDefault) + JsPlaceholder;
}