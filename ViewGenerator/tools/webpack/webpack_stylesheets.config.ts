import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { join } from "path";
import { Configuration } from "webpack";

import MiniCssExtractPluginCleanup from "./Plugins/MiniCssExtractPluginCleanup";
import { CssPlaceholder, JsMapPlaceholder, OutputDirectoryDefault } from "./Plugins/Resources";
import { getCurrentDirectory, sanitizeCommandLineParam } from "./Plugins/Utils"

import getResourcesRuleSet from "./Rules/Files";
import SassRuleSet from "./Rules/Sass";
import { getEntries } from "./Helpers";

const config = (env) => {
    const stylesheetsConfig: Configuration = {
        entry: getEntries(env.entryPath),

        output: {
            path: getCurrentDirectory(),
            filename: JsMapPlaceholder,
            publicPath: "/"
        },

        resolveLoader: {
            modules: [ join(__dirname, "/node_modules") ],
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
            name: "stylesheetsCache"
        };
    }

    return stylesheetsConfig;
};

export default config;
