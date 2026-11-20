import { existsSync } from "fs";
import { join, resolve } from "path";
import { Configuration } from "webpack";

import getCommonConfiguration from "./Plugins/CommonConfiguration";
import { Dictionary, getCurrentDirectory, getOutputPath, sanitizeCommandLineParam } from "./Plugins/Utils";
import { BindingsGeneratorPlugin } from "./Plugins/BindingsGenerator";
import { FullHashPlaceholder, IdPlaceholder, OutputDirectoryDefault, RuntimePlaceholder } from "./Plugins/Resources";

export interface ViewsConfigurationOptions {
    projectDirectory: string;
    assemblyName: string;
    outputPath: string;
    isProductionBuild: boolean;
    useCache: boolean;
    optimizeBundle: boolean;
    pluginsRelativePath?: string; // relative to the project directory
    forHotReload?: boolean;
    devServerUrl?: string;
    generatedPath?: string; // dev server: where the C# bindings are regenerated after every build
}

/*
 * Bundle of the views of one project: every file ts2lang.json selects is an entry exporting its component to
 * window.Views, the modules of the plugins project (pluginsRelativePath) are externals.
 * */
export function getViewsConfiguration(options: ViewsConfigurationOptions): Configuration {
    const { projectDirectory, assemblyName, forHotReload, devServerUrl } = options;

    let aliasMap: Dictionary<string> = {};
    let externalsMap: Dictionary<string> = {};

    // Get aliases and externals from a configuration file, if exists
    let generateExtendedConfig = (relativePath: string, throwError: boolean): void => {
        let fullPath: string = resolve(projectDirectory, relativePath.replace(/\\/g, "/"));

        let webpackOutputConfigFile = resolve(fullPath, "webpack-output-config.json");
        if (existsSync(webpackOutputConfigFile)) {
            let outputConfig = require(webpackOutputConfigFile);

            // Aliases
            let allAliases = outputConfig.alias;
            if (allAliases) {
                Object.keys(allAliases).forEach(key => aliasMap[key] = resolve(fullPath, allAliases[key]));
            }

            // Externals
            let allExternals = outputConfig.externals;
            if (allExternals) {
                Object.keys(allExternals).forEach(key => externalsMap["^(.*\/)?" + key + "$"] = allExternals[key]);
            }

        } else if (throwError) {
            throw new Error("Extended configuration file not found.");
        }
    };

    const standardConfig: Configuration = getCommonConfiguration({
        isProductionBuild: options.isProductionBuild,
        cacheName: options.useCache ? "viewsCache" : "",
        libraryName: "Views",
        outputPath: options.outputPath,
        projectDirectory,
        assemblyName,
        pluginsRelativePath: options.pluginsRelativePath,
        forHotReload,
        devServerUrl: forHotReload ? devServerUrl : undefined
    });

    standardConfig.name = assemblyName;

    if (!standardConfig.optimization) {
        standardConfig.optimization = {};
    }

    standardConfig.optimization.runtimeChunk = {
        name: "ViewsRuntime"
    };

    if (options.optimizeBundle) {
        // SplitChunksOptions
        standardConfig.optimization.splitChunks = {
            chunks: "all",
            minSize: 1
        };
    } else {
        standardConfig.optimization.splitChunks = false;
    }

    generateExtendedConfig(options.pluginsRelativePath || ".", !!options.pluginsRelativePath);

    // resolve.alias
    if (Object.keys(aliasMap).length > 0) {
        standardConfig.resolve.alias = aliasMap;
    }

    // externals
    if (Object.keys(externalsMap).length > 0) {
        standardConfig.externals = [
            standardConfig.externals as Dictionary<string>,
            function ({ context, request}, callback: any) {
                let match = Object.keys(externalsMap).find(key => new RegExp(key).test(request));
                if (match) {
                    return callback(null, externalsMap[match]);
                }
                callback();
            }
        ];
    }

    if (forHotReload) {
        standardConfig.output.hotUpdateChunkFilename = OutputDirectoryDefault + IdPlaceholder + "." + FullHashPlaceholder + ".hot-update.js";
        standardConfig.output.hotUpdateMainFilename = OutputDirectoryDefault + RuntimePlaceholder + "." + FullHashPlaceholder + ".hot-update.json";

        // the C# bindings follow the sources too, into the folder the regular build uses, for "dotnet watch" to pick up
        if (options.generatedPath) {
            standardConfig.plugins.push(new BindingsGeneratorPlugin({
                projectDirectory,
                assemblyName,
                generatedPath: options.generatedPath,
                ts2langScript: require.resolve("@outsystems/ts2lang/ts2lang-main.js"),
                template: join(__dirname, "..", "generator", "ViewGenerator.js")
            }));
        }
    }

    return standardConfig;
}

/*
 * Regular build (webpack --config webpack_views.config.js): one project, the current directory.
 * Hot reload is the dev server's business, see webpack_devserver.config.ts.
 * */
const config = (env, argv) => getViewsConfiguration({
    projectDirectory: getCurrentDirectory(),
    assemblyName: sanitizeCommandLineParam(env.assemblyName),
    outputPath: getOutputPath(env),
    isProductionBuild: argv.mode === "production",
    useCache: env.useCache === "true",
    optimizeBundle: env.optimizeBundle === "true",
    pluginsRelativePath: sanitizeCommandLineParam(env.pluginsRelativePath)
});

export default config;
