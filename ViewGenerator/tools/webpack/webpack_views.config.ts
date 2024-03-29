﻿import { existsSync } from "fs";
import { resolve } from "path";
import { Configuration } from "webpack";

import getCommonConfiguration from "./Plugins/CommonConfiguration";
import { Dictionary, sanitizeCommandLineParam } from "./Plugins/Utils";
import { FullHashPlaceholder, IdPlaceholder, OutputDirectoryDefault, RuntimePlaceholder } from "./Plugins/Resources";

const config = (env, argv) => {

    let aliasMap: Dictionary<string> = {};
    let externalsMap: Dictionary<string> = {};

    // Get aliases and externals from a configuration file, if exists
    let generateExtendedConfig = (relativePath: string, throwError: boolean): void => {
        let fullPath: string = relativePath.replace(/\\/g, "/")

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

    const sanitizedPluginsRelativePath: string = sanitizeCommandLineParam(env.pluginsRelativePath);

    const standardConfig: Configuration = getCommonConfiguration(
        argv.mode === "production", 
        env.useCache === "true" ? "viewsCache" : "", 
        "Views",
        sanitizeCommandLineParam(env.assemblyName),
        sanitizedPluginsRelativePath,
        env.forHotReload === "true");

    if (!standardConfig.optimization) {
        standardConfig.optimization = {};
    }

    standardConfig.optimization.runtimeChunk = {
        name: "ViewsRuntime"
    };

    if (env.optimizeBundle === "true") {
        // SplitChunksOptions
        standardConfig.optimization.splitChunks = {
            chunks: "all",
            minSize: 1
        };
    } else {
        standardConfig.optimization.splitChunks = false;
    }
    
    generateExtendedConfig(sanitizedPluginsRelativePath || ".", !!sanitizedPluginsRelativePath);

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

    if (env.forHotReload === "true") {
        standardConfig.output.hotUpdateChunkFilename = OutputDirectoryDefault + IdPlaceholder + "." + FullHashPlaceholder + ".hot-update.js";
        standardConfig.output.hotUpdateMainFilename = OutputDirectoryDefault + RuntimePlaceholder + "." + FullHashPlaceholder + ".hot-update.json";

        // @ts-ignore
        standardConfig.devServer = {
            client: {
                overlay: false
            },
            allowedHosts: "all",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store"
            }
        };
    }

    return standardConfig;
};

export default config;
