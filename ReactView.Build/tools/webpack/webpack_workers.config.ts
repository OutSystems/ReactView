import { resolve } from "path";
import { getCachePath, getCacheVersion, getCurrentDirectory, getOutputPath } from "./Plugins/Utils";
import { Configuration } from "webpack";
import { getEntries } from "./Helpers";

export interface WorkersConfigurationOptions {
    projectDirectory: string;
    name: string; // of the build, for the dev server status
    outputPath: string;
    entryPath: string; // the Workers items, ';' separated, relative to the project directory
    useCache: boolean;
}

/*
 * The web workers of a project (the Workers items), bundled one by one into Generated/.
 * */
export function getWorkersConfiguration(options: WorkersConfigurationOptions): Configuration {
    const { outputPath } = options;

    const workersConfig: Configuration = {
        name: options.name,

        context: options.projectDirectory,

        entry: getEntries(options.entryPath),

        optimization: {
            minimize: true
        },

        output: {
            globalObject: 'self',
            path: resolve(outputPath, "Generated")
        },
    };

    if (options.useCache) {
        workersConfig.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: "workersCache",
            version: getCacheVersion(),
            cacheDirectory: getCachePath(outputPath)
        }
    }

    return workersConfig;
}

const config = (env) => getWorkersConfiguration({
    projectDirectory: getCurrentDirectory(),
    name: "workers",
    outputPath: getOutputPath(env),
    entryPath: env.entryPath,
    useCache: env.useCache === "true"
});

export default config;
