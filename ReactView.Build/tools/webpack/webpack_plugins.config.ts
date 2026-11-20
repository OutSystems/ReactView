import { Configuration } from "webpack";

import getCommonConfiguration from "./Plugins/CommonConfiguration";
import DtsCleanupPlugin from "./Plugins/DtsCleanupPlugin";
import DtsGeneratorPlugin from "./Plugins/DtsGeneratorPlugin";
import { DtsFileName } from "./Plugins/Resources";
import { getCurrentDirectory, getOutputPath, sanitizeCommandLineParam } from "./Plugins/Utils";

export interface PluginsConfigurationOptions {
    projectDirectory: string;
    assemblyName: string;
    outputPath: string;
    isProductionBuild: boolean;
    useCache: boolean;
    devServerUrl?: string; // dev server: the bundles are fetched from it
}

/*
 * Bundle of a plugins project: the modules (mediators, providers, the view framework) the views of the other
 * projects use as externals, exported to window.Plugins, with a declaration file for those projects to compile against.
 * */
export function getPluginsConfiguration(options: PluginsConfigurationOptions): Configuration {
    const standardConfig: Configuration = getCommonConfiguration({
        isProductionBuild: options.isProductionBuild,
        cacheName: options.useCache ? "pluginsCache" : "",
        libraryName: "Plugins",
        outputPath: options.outputPath,
        projectDirectory: options.projectDirectory,
        assemblyName: options.assemblyName,
        devServerUrl: options.devServerUrl
    });

    standardConfig.name = options.assemblyName;

    if (!standardConfig.optimization) {
        standardConfig.optimization = {};
    }

    standardConfig.optimization.runtimeChunk = {
        name: "PluginsRuntime"
    };

    // Plugins
    standardConfig.plugins = standardConfig.plugins.concat(

        // DtsGeneratorPlugin
        new DtsGeneratorPlugin({ name: "", project: options.projectDirectory, out: DtsFileName }),

        // DtsCleanupPlugin
        new DtsCleanupPlugin([DtsFileName], [/\.d.ts$/])
    );

    return standardConfig;
}

const config = (env, argv) => getPluginsConfiguration({
    projectDirectory: getCurrentDirectory(),
    assemblyName: sanitizeCommandLineParam(env.assemblyName),
    outputPath: getOutputPath(env),
    isProductionBuild: argv.mode === "production",
    useCache: env.useCache === "true"
});

export default config;
