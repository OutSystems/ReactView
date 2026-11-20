import { existsSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { Configuration } from "webpack";

import { BuildKind, setServedBuilds, statusMiddleware, watchCompiler } from "./Plugins/DevServerStatus";
import { sanitizeCommandLineParam } from "./Plugins/Utils";
import { getPluginsConfiguration } from "./webpack_plugins.config";
import { getStylesheetsConfiguration } from "./webpack_stylesheets.config";
import { getViewsConfiguration } from "./webpack_views.config";
import { getWorkersConfiguration } from "./webpack_workers.config";

/*
 * The dev server (dotnet msbuild <project> -t:ReactViewDevServer): one webpack-dev-server serving the builds of every
 * project the target lists (the project itself and its ReactViewDevServerProject items), each under /<assembly>/, just
 * like the embedded resources are addressed. The target describes the projects in a JSON file (projectsFile) so that
 * MSBuild stays the only reader of the project files.
 *
 * A views project is built with react-refresh and the hot module replacement runtime, and its C# bindings are
 * regenerated after every build. A plugins project (the modules the views import as externals) is rebuilt and served
 * too; the loader reloads the views when it changes, those modules being globals every view captured when it loaded.
 * The default stylesheets and workers of each project are builds of their own.
 * */

interface ProjectDescription {
    project: string; // the csproj
    directory: string;
    assemblyName: string;
    kind: "views" | "plugins";
    bundle: boolean;
    pluginsRelativePath?: string;
    styleSheets?: string; // ';' separated, relative to the directory
    workers?: string; // ';' separated, relative to the directory
    generatedPath?: string; // where the C# bindings go (views projects generating bindings)
    outputPath: string; // where this server writes the bundles of the project
}

function readProjects(projectsFile: string): ProjectDescription[] {
    const projects: ProjectDescription[] = JSON.parse(readFileSync(projectsFile, "utf8")).projects;
    const seen = new Set<string>();
    return projects.filter(p => {
        if (!p.bundle) {
            console.log(`[ReactView] ${p.assemblyName} bundles nothing (ReactViewBundle=false), not served`);
            return false;
        }
        if (seen.has(p.assemblyName.toLowerCase())) {
            return false;
        }
        seen.add(p.assemblyName.toLowerCase());
        return true;
    });
}

/*
 * The views reference files of their dependencies (fonts, images) by /<assembly>/node_modules/<package>/<file>, the
 * resource name they are embedded with. Serves them from the node_modules the package resolves to from the project
 * (the project's own, or a hoisted one up the tree).
 * */
function nodeModulesMiddleware(projects: ProjectDescription[]): (request: any, response: any, next: () => void) => void {
    const byAssembly = new Map(projects.map(p => [p.assemblyName.toLowerCase(), p]));
    return (request, response, next) => {
        const match = /^\/([^/]+)\/node_modules\/(.+)$/.exec(decodeURIComponent((request.url || "").split("?")[0]));
        const project = match && byAssembly.get(match[1].toLowerCase());
        if (!project || match[2].includes("..")) {
            next();
            return;
        }
        for (let directory = project.directory; ; directory = dirname(directory)) {
            const file = join(directory, "node_modules", match[2]);
            if (existsSync(file) && statSync(file).isFile()) {
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Cache-Control", "no-store");
                response.sendFile(file);
                return;
            }
            if (dirname(directory) === directory) {
                break;
            }
        }
        next();
    };
}

const config = (env) => {
    const projectsFile: string = sanitizeCommandLineParam(env.projectsFile);
    const devServerUrl: string = sanitizeCommandLineParam(env.devServerUrl) || "http://localhost:8080";
    const projects = readProjects(projectsFile);

    const configurations: Configuration[] = [];
    const builds: { name: string, assembly: string, kind: BuildKind }[] = [];
    const add = (configuration: Configuration, assembly: string, kind: BuildKind): void => {
        configurations.push(configuration);
        builds.push({ name: configuration.name, assembly, kind });
    };

    const publicPathOf = (project: ProjectDescription): string => devServerUrl.replace(/\/+$/, "") + "/" + project.assemblyName + "/";

    projects.forEach(project => {
        const common = { projectDirectory: project.directory, assemblyName: project.assemblyName, outputPath: project.outputPath, isProductionBuild: false, useCache: false };

        if (project.kind === "plugins") {
            add(getPluginsConfiguration({ ...common, devServerUrl }), project.assemblyName, "plugins");
        } else {
            add(getViewsConfiguration({
                ...common,
                optimizeBundle: false,
                pluginsRelativePath: project.pluginsRelativePath,
                forHotReload: true,
                devServerUrl,
                generatedPath: project.generatedPath
            }), project.assemblyName, "views");
        }

        if (project.styleSheets) {
            add(getStylesheetsConfiguration({ ...common, entryPath: project.styleSheets, publicPath: publicPathOf(project) }), project.assemblyName, "stylesheets");
        }

        if (project.workers) {
            add(getWorkersConfiguration({ ...common, name: project.assemblyName + "/workers", entryPath: project.workers }), project.assemblyName, "workers");
        }
    });

    const url = new URL(devServerUrl);

    // the dev server options are read from the first configuration
    // @ts-ignore
    configurations[0].devServer = {
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
        // no devMiddleware.publicPath: each build is served at its own output.publicPath (<url>/<assembly>/)
        // project assets (images referenced by the views) are served from the project folders
        static: projects.map(project => ({
            directory: project.directory,
            publicPath: "/" + project.assemblyName + "/",
            watch: false
        })),
        setupMiddlewares: (middlewares, devServer) => {
            watchCompiler(devServer.compiler);
            setServedBuilds(builds);
            middlewares.unshift({ name: "reactview-status", middleware: statusMiddleware });
            middlewares.unshift({ name: "reactview-node-modules", middleware: nodeModulesMiddleware(projects) });
            return middlewares;
        }
    };

    return configurations;
};

export default config;
