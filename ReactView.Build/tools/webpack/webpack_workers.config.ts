import { resolve } from "path";
import { getCachePath, getCacheVersion, getOutputPath } from "./Plugins/Utils";
import { Configuration } from "webpack";
import { getEntries } from "./Helpers";

const config = (env) => {
    const outputPath: string = getOutputPath(env);

    const workersConfig: Configuration = {
        entry: getEntries(env.entryPath),

        optimization: {
            minimize: true
        },

        output: {
            globalObject: 'self',
            path: resolve(outputPath, "Generated")
        },
    };

    if (env.useCache === "true") {
        workersConfig.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: "workersCache",
            version: getCacheVersion(),
            cacheDirectory: getCachePath(outputPath)
        }
    }

    return workersConfig;
};

export default config;
