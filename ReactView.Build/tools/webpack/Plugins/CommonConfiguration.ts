import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { sync } from "glob";
import { join, parse, resolve } from "path";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
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
    CssExtension,
    JsExtension,
    RefreshEntryName
} from "./Resources";
import { Dictionary, generateManifest, getCachePath, getCacheVersion, getFileName, getLoaderDirectories } from "./Utils";

// Rules
import getResourcesRuleSet from "../Rules/Files";
import SassRuleSet from "../Rules/Sass";
import getTypeScriptRuleSet from "../Rules/TypeScript";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

let getCommonConfiguration = (isProductionBuild: boolean, cacheName: string, libraryName: string, outputPath: string, assemblyName?: string, pluginsRelativePath?: string, forHotReload?: boolean, devServerUrl?: string): Configuration => {

    const entryMap: Dictionary<string> = {}
    const outputMap: Dictionary<string> = {};
    const namespaceMap: Dictionary<string> = {};
    const entryFiles: string[] = [];

    // Build entry, output, and namespace mappings for webpack config
    let getConfiguration = (input: string, output: string, namespace: string): void => {
        sync(input).forEach(f => {

            // Exclude node_modules and d.ts files
            if (!f.includes("node_modules") && !f.endsWith(DtsExtension)) {

                let entryName: string = parse(f).name;
                entryMap[entryName] = "./" + f;
                entryFiles.push(resolve(f));
                outputMap[entryName] = output;
                namespaceMap[entryName] = namespace;
            }
        });
    }

    // Gets input and output entries from ts2lang file
    require(resolve("./ts2lang.json")).tasks.forEach(t => getConfiguration(t.input, t.output, t.parameters.namespace));

    if (forHotReload) {
        // entry the loader runs before React in dev mode, see hot/RefreshSetup.ts
        entryMap[RefreshEntryName] = join(__dirname, "..", "hot", "RefreshSetup.js");
        outputMap[RefreshEntryName] = OutputDirectoryDefault;
        namespaceMap[RefreshEntryName] = assemblyName;
    }

    // in dev mode the shared chunks (the webpack runtime above all) keep a stable name: a view created after a rebuild
    // must load the very same urls as the views before it, or the document ends up with two webpack runtimes
    const jsChunkPlaceholder: string = forHotReload ? NamePlaceholder + JsExtension : JsChunkPlaceholder;

    // in dev mode the bundles, and therefore the hot updates, are fetched straight from the dev server
    const publicPath: string = (devServerUrl ? devServerUrl.replace(/\/+$/, "") : "") + "/" + assemblyName + "/";

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
            path: outputPath,
            filename: (chunkData) => getFileName(outputMap, chunkData, jsChunkPlaceholder),
            chunkFilename: OutputDirectoryDefault + jsChunkPlaceholder,
            library: [libraryName, NamePlaceholder],
            assetModuleFilename: ".bootstrap/[hash][ext][query]",
            libraryTarget: "window",
            globalObject: "window",
            devtoolNamespace: libraryName,
            publicPath: publicPath
        },

        node: false,

        resolveLoader: {
            modules: getLoaderDirectories(),
        },

        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            // the hot entry and the react-refresh runtime live in the tools install, not next to the project
            modules: ["node_modules", ...getLoaderDirectories()]
        },

        module: {
            rules: [
                SassRuleSet,
                getResourcesRuleSet(assemblyName, pluginsAssembly),
                getTypeScriptRuleSet(forHotReload, !cacheName),
                // dev server build: the view entries accept the updates react-refresh cannot apply in place (see hot/HotEntryLoader.ts)
                ...(forHotReload ? [{ test: entryFiles, enforce: "post" as const, loader: join(__dirname, "..", "hot", "HotEntryLoader.js") }] : [])
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
                generate: (seed, files) => generateManifest(seed, files, outputPath, outputMap, namespaceMap)
            }),
        ]
    };
    
    if (forHotReload) {
        Configuration.plugins.push(new ReactRefreshWebpackPlugin({ overlay: false }));
    }

    if (isProductionBuild) {
        Configuration.optimization = {
            flagIncludedChunks: false,
            minimize: true,
            minimizer: [new TerserPlugin({
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true,
                    toplevel: true,
                    module: true
                }
            })]
        }
        
    } else if (cacheName) {
        Configuration.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: cacheName,
            version: getCacheVersion(),
            cacheDirectory: getCachePath(outputPath)
        };
    }

    return Configuration;
};

export default getCommonConfiguration;
