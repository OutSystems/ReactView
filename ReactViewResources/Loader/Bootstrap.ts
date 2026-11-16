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
 * Loads the dev server entry that sets react-refresh up (the webpack runtime it shares with the views comes first).
 * */
async function loadRefreshRuntime(view: ViewMetadata): Promise<void> {
    const refreshEntryName = "ReactViewRefresh";
    const response = await fetch(devServerBaseUrl + "manifest.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`ReactView dev server manifest not available at '${devServerBaseUrl}' (${response.status})`);
    }
    const manifest: { [entry: string]: string[] } = await response.json();
    const files = (manifest[refreshEntryName] || []).filter(f => f.endsWith(".js"));
    if (files.length === 0) {
        throw new Error(`ReactView dev server manifest has no '${refreshEntryName}' entry; is the dev server running with hot reload?`);
    }
    for (const file of files) {
        await loadScript(devServerBaseUrl + file, view);
    }
}

bootstrap();