import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { join } from "path";
import { Configuration } from "webpack";

import MiniCssExtractPluginCleanup from "./Plugins/MiniCssExtractPluginCleanup";
import { CssPlaceholder, JsMapPlaceholder, OutputDirectoryDefault } from "./Plugins/Resources";
import { Dictionary, getCurrentDirectory, sanitizeCommandLineParam } from "./Plugins/Utils"

import getResourcesRuleSet from "./Rules/Files";
import SassRuleSet from "./Rules/Sass";

const config = (env) => {

    const getEntryName = (entryPath: string): string => {
        const fileExtensionLen: number = entryPath.length - entryPath.lastIndexOf(".");
        return entryPath.slice(entryPath.replace(/\//g, '\\').lastIndexOf("\\") + 1, -fileExtensionLen);
    };

    let entries: string = sanitizeCommandLineParam(env.entryPath);
    let entryMap: Dictionary<string> = {};
    entries.split(";").map(entryPath => entryMap[getEntryName(entryPath)] = './' + entryPath)

    const stylesheetsConfig: Configuration = {
        entry: entryMap,

        output: {
            path: getCurrentDirectory(),
            filename: JsMapPlaceholder,
            publicPath: "/"
        },

        cache: {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: "stylesheetsCache"
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

    return stylesheetsConfig;
};

export default config;
