import { resolve } from "path";
import { getCurrentDirectory } from "./Plugins/Utils";
import { Configuration } from "webpack";
import { getEntries } from "./Helpers";

const config = (env) => {
    const workersConfig: Configuration = {
        entry: getEntries(env.entryPath),

        optimization: {
            minimize: true
        },

        output: {
            globalObject: 'self',
            path: resolve(getCurrentDirectory(), "Generated")
        },
    };

    if (env.useCache === "true") {
        workersConfig.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: "workersCache"
        }
    }

    return workersConfig;
};

export default config;
