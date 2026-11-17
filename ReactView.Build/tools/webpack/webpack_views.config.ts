import { existsSync } from "fs";
import { resolve } from "path";
import { Configuration } from "webpack";

import getCommonConfiguration from "./Plugins/CommonConfiguration";
import { Dictionary, getCurrentDirectory, getOutputPath, sanitizeCommandLineParam } from "./Plugins/Utils";
import { setServedAssembly, statusMiddleware, watchCompiler } from "./Plugins/DevServerStatus";
import stylesheetsConfig from "./webpack_stylesheets.config";
import { BindingsGeneratorPlugin } from "./Plugins/BindingsGenerator";
import { join } from "path";
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
    const assemblyName: string = sanitizeCommandLineParam(env.assemblyName);
    const forHotReload: boolean = env.forHotReload === "true";
    const devServerUrl: string = sanitizeCommandLineParam(env.devServerUrl) || "http://localhost:8080";

    const standardConfig: Configuration = getCommonConfiguration(
        argv.mode === "production", 
        env.useCache === "true" ? "viewsCache" : "", 
        "Views",
        getOutputPath(env),
        assemblyName,
        sanitizedPluginsRelativePath,
        forHotReload,
        forHotReload ? devServerUrl : undefined);

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

    if (forHotReload) {
        standardConfig.output.hotUpdateChunkFilename = OutputDirectoryDefault + IdPlaceholder + "." + FullHashPlaceholder + ".hot-update.js";
        standardConfig.output.hotUpdateMainFilename = OutputDirectoryDefault + RuntimePlaceholder + "." + FullHashPlaceholder + ".hot-update.json";

        const url = new URL(devServerUrl);
        const servedPath: string = "/" + assemblyName + "/";

        // @ts-ignore
        standardConfig.devServer = {
            // "localhost" would bind a single stack (::1 on recent Node), and the host application may connect over the other
            host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
            port: Number(url.port) || 80,
            // the page is not served by this server, so the client cannot derive the socket url from its location
            client: {
                overlay: false,
                logging: "info",
                webSocketURL: { protocol: "ws", hostname: url.hostname, port: Number(url.port) || 80, pathname: "/ws" }
            },
            // an update that cannot be applied in place is reported, never turned into a page reload the host does not expect
            hot: "only",
            liveReload: false,
            allowedHosts: "all",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store"
            },
            devMiddleware: {
                publicPath: servedPath
            },
            // project assets (images referenced by the views) are served from the project folder
            static: {
                directory: getCurrentDirectory(),
                publicPath: servedPath,
                watch: false
            },
            setupMiddlewares: (middlewares, devServer) => {
                watchCompiler(devServer.compiler);
                setServedAssembly(assemblyName);
                middlewares.unshift({ name: "reactview-status", middleware: statusMiddleware });
                return middlewares;
            }
        };

        // the C# bindings follow the sources too, into the folder the regular build uses, for "dotnet watch" to pick up
        const generatedPath: string = sanitizeCommandLineParam(env.generatedPath);
        if (generatedPath) {
            standardConfig.plugins.push(new BindingsGeneratorPlugin({
                projectDirectory: getCurrentDirectory(),
                generatedPath: generatedPath,
                ts2langScript: require.resolve("@outsystems/ts2lang/ts2lang-main.js"),
                template: join(__dirname, "..", "generator", "ViewGenerator.js")
            }));
        }

        // the default stylesheets are a build of their own; the dev server runs it alongside so that they are served
        // (and rebuilt on change) too. The loader refreshes their links after every update.
        const stylesheetsEntryPath: string = sanitizeCommandLineParam(env.stylesheetsEntryPath);
        if (stylesheetsEntryPath) {
            const stylesheets: Configuration = stylesheetsConfig({ ...env, entryPath: stylesheetsEntryPath });
            stylesheets.output.publicPath = standardConfig.output.publicPath;
            return [standardConfig, stylesheets] as any;
        }
    }

    return standardConfig;
};

export default config;
