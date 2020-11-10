import { waitForDOMReady } from "./Internal/Common";
import { libsPath, mainFrameName, webViewRootId } from "./Internal/Environment";
import { ObservableListCollection } from "./Internal/ObservableCollection";
import { loadScript } from "./Internal/ResourcesLoader";
import { Task } from "./Internal/Task";
import { ViewMetadata } from "./Internal/ViewMetadata";
import { addView, getView } from "./Internal/ViewsCollection";

declare function define(name: string, dependencies: string[], definition: Function);

async function bootstrap() {
    await waitForDOMReady();

    const rootElement = document.getElementById(webViewRootId);
    if (!rootElement) {
        throw new Error("Root element not found");
    }

    const mainView: ViewMetadata = {
        id: 0,
        name: mainFrameName,
        generation: 0,
        isMain: true,
        placeholder: rootElement,
        head: document.head,
        root: rootElement,
        modules: new Map<string, any>(),
        nativeObjectNames: [],
        pluginsLoadTask: new Task(),
        scriptsLoadTasks: new Map<string, Task<void>>(),
        childViews: new ObservableListCollection<ViewMetadata>(),
        parentView: null!
    };
    addView(mainFrameName, mainView);

    await loadFramework();

    const loader = await import("./Loader");
    loader.initialize();
}

async function loadFramework(): Promise<void> {
    const reactLib: string = "React";
    const reactDOMLib: string = "ReactDOM";
    const schedulerLib: string = "Scheduler";
    const externalLibsPath = libsPath + "node_modules/";

    const view = getView(mainFrameName);
    await loadScript(externalLibsPath + "prop-types/prop-types.min.js", view); /* Prop-Types */
    await loadScript(externalLibsPath + "react/umd/react.production.min.js", view); /* React */
    await loadScript(externalLibsPath + "react-dom/umd/react-dom.production.min.js", view); /* ReactDOM */
    await loadScript(externalLibsPath + "scheduler/umd/scheduler.production.min.js", view); /* Scheduler */

    define("react", [], () => window[reactLib]);
    define("react-dom", [], () => window[reactDOMLib]);
    define("scheduler", [], () => window[schedulerLib]);
}

bootstrap();