import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { sync } from "glob";
import { join, parse, resolve } from "path";
import TerserPlugin from "terser-webpack-plugin";
import Webpack from "webpack";
import { Configuration } from "webpack";
import { WebpackManifestPlugin } from "webpack-manifest-plugin";

// Plugins / Resources
import {
    CssPlaceholder,
    CssChunkPlaceholder,
    DtsExtension,
    OutputDirectoryDefault,
    JsChunkPlaceholder,
    NamePlaceholder,
    IdPlaceholder,
    CssExtension
} from "./Resources";
import { Dictionary, generateManifest, getCurrentDirectory, getFileName } from "./Utils";

// Rules
import getResourcesRuleSet from "../Rules/Files";
import SassRuleSet from "../Rules/Sass";
import getTypeScriptRuleSet from "../Rules/TypeScript";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

let getCommonConfiguration = (isProductionBuild: boolean, cacheName: string, libraryName: string, assemblyName?: string, pluginsRelativePath?: string, forHotReload?: boolean): Configuration => {

    const entryMap: Dictionary<string> = {}
    const outputMap: Dictionary<string> = {};
    const namespaceMap: Dictionary<string> = {};

    // Build entry, output, and namespace mappings for webpack config
    let getConfiguration = (input: string, output: string, namespace: string): void => {
        sync(input).forEach(f => {

            // Exclude node_modules and d.ts files
            if (!f.includes("node_modules") && !f.endsWith(DtsExtension)) {

                let entryName: string = parse(f).name;
                entryMap[entryName] = "./" + f;
                outputMap[entryName] = output;
                namespaceMap[entryName] = namespace;
            }
        });
    }

    // Gets input and output entries from ts2lang file
    require(resolve("./ts2lang.json")).tasks.forEach(t => getConfiguration(t.input, t.output, t.parameters.namespace));

    let currentDirectory: string = getCurrentDirectory();

    let pluginsAssembly: string;
    if (pluginsRelativePath) {
        let pathParts: string[] = pluginsRelativePath.replace(/\\/g, "/").split("/");

        // Handle potential trailing slash
        //
        // E.g. if pluginsRelativePath is "../path/to/plugin/", we want to get the "plugin" part,
        // and therefore we perform a pop twice, as the last portion will be an empty string.
        pluginsAssembly = pathParts.pop() || pathParts.pop();
    }

    const Configuration: Configuration = {
        stats: "minimal",

        entry: entryMap,

        externals: {
            "react": "React",
            "react-dom": "ReactDOM",
            "prop-types": "PropTypes",
            "ViewFrame": "ViewFrame",
            "PluginsProvider": "PluginsProvider",
            "ResourceLoader": "ResourceLoader"
        },

        output: {
            path: currentDirectory,
            filename: (chunkData) => getFileName(outputMap, chunkData),
            chunkFilename: OutputDirectoryDefault + JsChunkPlaceholder,
            library: [libraryName, NamePlaceholder],
            libraryTarget: "window",
            globalObject: "window",
            devtoolNamespace: libraryName,
            publicPath: "/" + assemblyName + "/"
        },

        node: false,

        resolveLoader: {
            modules: [join(__dirname, "/../node_modules")],
        },

        resolve: {
            extensions: [".ts", ".tsx", ".js"]
        },

        module: {
            rules: [
                SassRuleSet,
                getResourcesRuleSet(assemblyName, pluginsAssembly),
                getTypeScriptRuleSet(forHotReload, !cacheName)
            ]
        },

        plugins: [
            new Webpack.WatchIgnorePlugin({
                paths: [ /scss\.d\.ts$/]
            }),

            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    diagnosticOptions: { syntactic: true, semantic: true, declaration: false, global: false },
                }
            }),

            new MiniCssExtractPlugin({
                filename: (chunkData) => {
                    const Directory: string = outputMap[chunkData.chunk.name];
                    if (Directory) {
                        return Directory + CssPlaceholder;
                    }
                    return OutputDirectoryDefault + CssChunkPlaceholder;
                },
                chunkFilename: OutputDirectoryDefault + (forHotReload ? IdPlaceholder + CssExtension : CssChunkPlaceholder)
            }),

            new WebpackManifestPlugin({
                fileName: "manifest.json",
                generate: (seed, files) => generateManifest(seed, files, outputMap, namespaceMap)
            }),
        ]
    };
    
    if (isProductionBuild) {
        Configuration.optimization.minimize = true;
        
        let terserPluginOptions: any = {
            terserOptions: {
                keep_classnames: true,
                keep_fnames: true,
                topLevel: true,
                module: true
            }
        }
        Configuration.optimization.minimizer = [new TerserPlugin(terserPluginOptions)];
        
    } else if (cacheName) {
        Configuration.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: cacheName
        };
    }

    return Configuration;
};

export default getCommonConfiguration;
