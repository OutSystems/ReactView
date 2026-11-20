import { waitForDOMReady } from "./Internal/Common";
import { devServerBaseUrl, libsPath, mainFrameName, webViewRootId } from "./Internal/Environment";
import { loadScript } from "./Internal/ResourcesLoader";
import { newView, ViewMetadata } from "./Internal/ViewMetadata";

declare function define(name: string, dependencies: string[], definition: Function);

async function bootstrap() {
    await waitForDOMReady();

    const rootElement = document.getElementById(webViewRootId);
    if (!rootElement) {
        throw new Error("Root element not found");
    }

    const mainView = newView(0, mainFrameName, true, rootElement);
    mainView.head = document.head;
    mainView.root = rootElement;

    await loadFramework(mainView);

    const loader = await import("./Loader");
    loader.initialize(mainView);
}

async function loadFramework(view: ViewMetadata): Promise<void> {
    const reactLib: string = "React";
    const reactDOMLib: string = "ReactDOM";
    const externalLibsPath = libsPath + "node_modules/";

    await loadScript(externalLibsPath + "prop-types/prop-types.min.js", view); /* Prop-Types */

    if (devServerBaseUrl) {
        // dev mode: the react-refresh runtime must hook React before react-dom loads, and refresh only works with
        // the development build of React
        await loadRefreshRuntime(view);
        await loadScript(externalLibsPath + "react/umd/react.development.js", view);
        await loadScript(externalLibsPath + "react-dom/umd/react-dom.development.js", view);
    } else {
        await loadScript(externalLibsPath + "react/umd/react.production.min.js", view); /* React */
        await loadScript(externalLibsPath + "react-dom/umd/react-dom.production.min.js", view); /* ReactDOM */
    }

    define("react", [], () => window[reactLib]);
    define("react-dom", [], () => window[reactDOMLib]);
}

/*
 * Loads the dev server entries that set react-refresh up, one per views assembly the server builds (the webpack
 * runtime each one shares with its views comes first). The scripts are loaded by the same urls the views' dependencies
 * use, so that they run once; every runtime hooks React before react-dom loads, whichever assembly's views the page
 * ends up showing.
 * */
async function loadRefreshRuntime(view: ViewMetadata): Promise<void> {
    const refreshEntryName = "ReactViewRefresh";
    const statusResponse = await fetch(devServerBaseUrl + "__reactview/status", { cache: "no-store" });
    if (!statusResponse.ok) {
        throw new Error(`ReactView dev server status not available at '${devServerBaseUrl}' (${statusResponse.status})`);
    }
    const builds: { assembly: string, kind: string }[] = (await statusResponse.json()).builds || [];
    const assemblies = builds.filter(b => b.kind === "views").map(b => b.assembly);
    if (assemblies.length === 0) {
        throw new Error(`ReactView dev server at '${devServerBaseUrl}' builds no views project`);
    }
    for (const assembly of assemblies) {
        const bootstrapBaseUrl = devServerBaseUrl + assembly + "/";
        const response = await fetch(bootstrapBaseUrl + "manifest.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`ReactView dev server manifest not available at '${bootstrapBaseUrl}' (${response.status})`);
        }
        const manifest: { [entry: string]: string[] } = await response.json();
        const files = (manifest[refreshEntryName] || []).filter(f => f.endsWith(".js"));
        if (files.length === 0) {
            throw new Error(`ReactView dev server manifest of ${assembly} has no '${refreshEntryName}' entry; is the dev server running with hot reload?`);
        }
        for (const file of files) {
            await loadScript(bootstrapBaseUrl + file, view);
        }
    }
}

bootstrap();