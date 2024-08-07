﻿import { Configuration } from "webpack";

import getCommonConfiguration from "./Plugins/CommonConfiguration";
import DtsCleanupPlugin from "./Plugins/DtsCleanupPlugin";
import DtsGeneratorPlugin from "./Plugins/DtsGeneratorPlugin";
import { DtsFileName } from "./Plugins/Resources";
import { getCurrentDirectory, sanitizeCommandLineParam } from "./Plugins/Utils";

const config = (env, argv) => {

    const standardConfig: Configuration =  getCommonConfiguration(
        argv.mode === "production",
        env.useCache === "true" ? "pluginsCache" : "",
        "Plugins",
        sanitizeCommandLineParam(env.assemblyName));

    if (!standardConfig.optimization) {
        standardConfig.optimization = {};
    }

    standardConfig.optimization.runtimeChunk = {
        name: "PluginsRuntime"
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
