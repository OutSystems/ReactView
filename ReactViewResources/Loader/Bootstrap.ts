import { waitForDOMReady } from "./Internal/Common";
import { libsPath, mainFrameName, webViewRootId } from "./Internal/Environment";
import { loadScript } from "./Internal/ResourcesLoader";
import { newView } from "./Internal/ViewMetadata";

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

    await loadFramework();

    const loader = await import("./Loader");
    loader.initialize(mainView);
}

async function loadFramework(): Promise<void> {
    const reactLib: string = "React";
    const reactDOMLib: string = "ReactDOM";
    const externalLibsPath = libsPath + "node_modules/";

    await loadScript(externalLibsPath + "prop-types/prop-types.min.js"); /* Prop-Types */
    await loadScript(externalLibsPath + "react/umd/react.production.min.js"); /* React */
    await loadScript(externalLibsPath + "react-dom/umd/react-dom.production.min.js"); /* ReactDOM */

    define("react", [], () => window[reactLib]);
    define("react-dom", [], () => window[reactDOMLib]);
}

bootstrap();