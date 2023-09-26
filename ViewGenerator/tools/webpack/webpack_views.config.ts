﻿import { existsSync } from "fs";
import { resolve } from "path";
import { Configuration } from "webpack";

import getCommonConfiguration from "./Plugins/CommonConfiguration";
import { Dictionary } from "./Plugins/Utils";

const config = (env) => {

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

    let standardConfig: Configuration = getCommonConfiguration("Views", env.useCache, env.assemblyName, env.pluginsRelativePath);

    (standardConfig.cache as any).name = "viewsCache";
    
    standardConfig.optimization = {
        runtimeChunk: {
            name: "ViewsRuntime"
        },
        // SplitChunksOptions
        splitChunks: {
            chunks: "all",
            minSize: 1,
            cacheGroups: {
                vendors: {
                    test: /[\\/](node_modules)[\\/]/
                }
            }
        }
    };
    
    generateExtendedConfig(env.pluginsRelativePath || ".", !!env.pluginsRelativePath);

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

    if (env.useCache) {
        // @ts-ignore
        standardConfig.devServer = {
            disableHostCheck: true
        };
    }

    return standardConfig;
};

export default config;
