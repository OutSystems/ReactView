import { Configuration } from "webpack";

import getCommonConfiguration from "./Plugins/CommonConfiguration";
import DtsCleanupPlugin from "./Plugins/DtsCleanupPlugin";
import DtsGeneratorPlugin from "./Plugins/DtsGeneratorPlugin";
import { DtsFileName } from "./Plugins/Resources";
import { getCurrentDirectory, sanitizeCommandLineParam } from "./Plugins/Utils";

const config = (env) => {

    const standardConfig: Configuration = getCommonConfiguration("Plugins", env.useCache, sanitizeCommandLineParam(env.assemblyName));

    (standardConfig.cache as any).name = "pluginsCache";
    
    standardConfig.optimization = {
        runtimeChunk: {
            name: "PluginsRuntime"
        }
    };

    // Plugins
    standardConfig.plugins = standardConfig.plugins.concat(

        // DtsGeneratorPlugin
        new DtsGeneratorPlugin({ name: "", project: getCurrentDirectory(), out: DtsFileName }),

        // DtsCleanupPlugin
        new DtsCleanupPlugin([DtsFileName], [/\.d.ts$/])
    );

    return standardConfig;
};

export default config;
