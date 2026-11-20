import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { Configuration } from "webpack";

import MiniCssExtractPluginCleanup from "./Plugins/MiniCssExtractPluginCleanup";
import { CssPlaceholder, JsMapPlaceholder, OutputDirectoryDefault } from "./Plugins/Resources";
import { getCachePath, getCacheVersion, getCurrentDirectory, getLoaderDirectories, getOutputPath, sanitizeCommandLineParam } from "./Plugins/Utils"

import getResourcesRuleSet from "./Rules/Files";
import SassRuleSet from "./Rules/Sass";
import { getEntries } from "./Helpers";

export interface StylesheetsConfigurationOptions {
    projectDirectory: string;
    assemblyName: string;
    outputPath: string;
    entryPath: string; // the DefaultStyleSheet items, ';' separated, relative to the project directory
    useCache: boolean;
    publicPath?: string; // dev server: where the stylesheets are fetched from
}

/*
 * The default stylesheets of a project (the DefaultStyleSheet items), each an entry of its own.
 * */
export function getStylesheetsConfiguration(options: StylesheetsConfigurationOptions): Configuration {
    const { outputPath } = options;

    const stylesheetsConfig: Configuration = {
        name: options.assemblyName + "/stylesheets",

        context: options.projectDirectory,

        entry: getEntries(options.entryPath),

        output: {
            path: outputPath,
            filename: JsMapPlaceholder,
            publicPath: options.publicPath || "/"
        },

        resolveLoader: {
            modules: getLoaderDirectories(),
        },

        module: {
            rules: [
                SassRuleSet,
                getResourcesRuleSet(options.assemblyName)
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
    
    if (options.useCache) {
        stylesheetsConfig.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: "stylesheetsCache",
            version: getCacheVersion(),
            cacheDirectory: getCachePath(outputPath)
        };
    }

    return stylesheetsConfig;
}

const config = (env) => getStylesheetsConfiguration({
    projectDirectory: getCurrentDirectory(),
    assemblyName: sanitizeCommandLineParam(env.assemblyName),
    outputPath: getOutputPath(env),
    entryPath: env.entryPath,
    useCache: env.useCache === "true"
});

export default config;
