import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { Configuration } from "webpack";

import MiniCssExtractPluginCleanup from "./Plugins/MiniCssExtractPluginCleanup";
import { CssPlaceholder, JsMapPlaceholder, OutputDirectoryDefault } from "./Plugins/Resources";
import { getCachePath, getCacheVersion, getLoaderDirectories, getOutputPath, sanitizeCommandLineParam } from "./Plugins/Utils"

import getResourcesRuleSet from "./Rules/Files";
import SassRuleSet from "./Rules/Sass";
import { getEntries } from "./Helpers";

const config = (env) => {
    const outputPath: string = getOutputPath(env);

    const stylesheetsConfig: Configuration = {
        entry: getEntries(env.entryPath),

        output: {
            path: outputPath,
            filename: JsMapPlaceholder,
            publicPath: "/"
        },

        resolveLoader: {
            modules: getLoaderDirectories(),
        },

        module: {
            rules: [
                SassRuleSet,
                getResourcesRuleSet(sanitizeCommandLineParam(env.assemblyName))
            ]
        },
        
        watchOptions: {
            ignored: /\\.(sa|sc|c)ss\\.d\\.ts$/
        },

        plugins: [
            new MiniCssExtractPlugin({ filename: OutputDirectoryDefault + CssPlaceholder }),
            new MiniCssExtractPluginCleanup([/\.js.map$/]),
        ]
    }
    
    if (env.useCache === "true") {
        stylesheetsConfig.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: "stylesheetsCache",
            version: getCacheVersion(),
            cacheDirectory: getCachePath(outputPath)
        };
    }

    return stylesheetsConfig;
};

export default config;
