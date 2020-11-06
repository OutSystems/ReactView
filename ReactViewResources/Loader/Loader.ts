/// <reference path="./../../ViewGenerator/contentFiles/global.d.ts"/>

import { getPluginModule, getStylesheets, getViewModule, waitForDOMReady, waitForNextPaint } from "./Internal/Common";
import { customResourceBaseUrl, libsPath, mainFrameName, webViewRootId } from "./Internal/Environment";
import { handleError } from "./Internal/ErrorHandler";
import { bindNativeObject, notifyViewInitialized, notifyViewLoaded } from "./Internal/NativeAPI";
import { createPropertiesProxy } from "./Internal/NativeObjectProxy";
import { ObservableListCollection } from "./Internal/ObservableCollection";
import { loadScript, loadStyleSheet } from "./Internal/ResourcesLoader";
import { Task } from "./Internal/Task";
import { ViewMetadata } from "./Internal/ViewMetadata";
import { addView, getView } from "./Internal/ViewsCollection";

export { disableInputInteractions } from "./Internal/InputManager";
export { showErrorMessage } from "./Internal/MessagesProvider";
export { syncFunction } from "./Internal/NativeObjectProxy";

declare function define(name: string, dependencies: string[], definition: Function);

const bootstrapTask = new Task();
const defaultStylesheetLoadTask = new Task();

export const loadDefaultStyleSheet = (() => {
    let defaultStyleSheetLink: HTMLLinkElement;

    return (stylesheet: string): void => {
        if (defaultStyleSheetLink) {
            defaultStyleSheetLink.setAttribute("href", stylesheet);
            return;
        }

        async function innerLoad() {
            try {
                await bootstrapTask.promise;
                const styleSheet = await loadStyleSheet(stylesheet, document.head, true);

                if (!defaultStyleSheetLink) {
                    defaultStyleSheetLink = styleSheet;
                }

                defaultStylesheetLoadTask.setResult();
            } catch (error) {
                handleError(error);
            }
        }

        innerLoad();
    };
})();

export function loadPlugins(plugins: any[][], frameName: string): void {
    async function innerLoad() {
        let view: ViewMetadata;
        try {
            await bootstrapTask.promise;

            view = getView(frameName);

            if (!view.isMain) {
                // wait for main frame plugins to be loaded, otherwise modules won't be loaded yet
                await getView(mainFrameName).pluginsLoadTask.promise;
            }

            if (plugins && plugins.length > 0) {
                // load plugin modules
                const pluginsPromises = plugins.map(async m => {
                    const moduleName: string = m[0];
                    const mainJsSource: string = m[1];
                    const nativeObjectFullName: string = m[2]; // fullname with frame name included
                    const dependencySources: string[] = m[3];

                    if (view.isMain) {
                        // only load plugins sources once (in the main frame)
                        // load plugin dependency js sources
                        const dependencySourcesPromises = dependencySources.map(s => loadScript(s, view));
                        await Promise.all(dependencySourcesPromises);

                        // plugin main js source
                        await loadScript(mainJsSource, view);
                    }

                    const module = getPluginModule(moduleName) || getViewModule(moduleName);
                    if (!module || !module.default) {
                        throw new Error(`Failed to load '${moduleName}' (might not be a module with a default export)`);
                    }

                    const pluginNativeObject = await bindNativeObject(nativeObjectFullName);

                    view.nativeObjectNames.push(nativeObjectFullName); // add to the native objects collection
                    view.modules.set(moduleName, new module.default(pluginNativeObject, view.root));
                });

                await Promise.all(pluginsPromises);
            }

            view.pluginsLoadTask.setResult();
        } catch (error) {
            handleError(error, view!);
        }
    }

    innerLoad();
}

export function loadComponent(
    componentName: string,
    componentNativeObjectName: string,
    componentSource: string,
    dependencySources: string[],
    cssSources: string[],
    maxPreRenderedCacheEntries: number,
    hasStyleSheet: boolean,
    hasPlugins: boolean,
    componentNativeObject: any,
    frameName: string,
    componentHash: string): void {

    function getComponentCacheKey(propertiesHash: string) {
        return componentSource + "|" + propertiesHash;
    }

    async function innerLoad() {
        let view: ViewMetadata;
        try {
            if (hasStyleSheet) {
                // wait for the stylesheet to load before first render
                await defaultStylesheetLoadTask.promise;
            }

            view = getView(frameName);
            const head = view.head;
            const rootElement = view.root;

            if (!rootElement || !head) {
                throw new Error(`View ${view.name} head or root is not set`);
            }

            const componentCacheKey = getComponentCacheKey(componentHash);
            const enableHtmlCache = view.isMain; // disable cache retrieval for inner views, since react does not currently support portals hydration
            const cachedComponentHtml = enableHtmlCache ? localStorage.getItem(componentCacheKey) : null;
            const shouldStoreComponentHtml = enableHtmlCache && !cachedComponentHtml && maxPreRenderedCacheEntries > 0;
            if (cachedComponentHtml) {
                // render cached component html to reduce time to first render
                rootElement.innerHTML = cachedComponentHtml;
                await waitForNextPaint();
            }

            const promisesToWaitFor = [bootstrapTask.promise];
            if (hasPlugins) {
                promisesToWaitFor.push(view.pluginsLoadTask.promise);
            }
            await Promise.all(promisesToWaitFor);

            // load component dependencies js sources and css sources
            const dependencyLoadPromises = dependencySources.map(s => loadScript(s, view) as Promise<any>)
                .concat(cssSources.map(s => loadStyleSheet(s, head, false)));
            await Promise.all(dependencyLoadPromises);

            // main component script should be the last to be loaded, otherwise errors might occur
            await loadScript(componentSource, view);

            const renderTask = shouldStoreComponentHtml ? new Task<void>() : undefined;

            // create proxy for properties obj to delay its methods execution until native object is ready
            const properties = createPropertiesProxy(componentNativeObject, componentNativeObjectName, renderTask);
            view.nativeObjectNames.push(componentNativeObjectName); // add to the native objects collection

            const componentClass = (getViewModule(componentName) || {}).default;
            if (!componentClass) {
                throw new Error(`Component ${componentName} is not defined or does not have a default class`);
            }

            const { createView } = await import("./Internal/Loader.View");

            const viewElement = createView(componentClass, properties, view, componentName);
            const render = view.renderHandler;
            if (!render) {
                throw new Error(`View ${view.name} render handler is not set`);
            }

            await render(viewElement);

            await waitForNextPaint();

            if (shouldStoreComponentHtml) {
                // cache view html for further use
                const elementHtml = rootElement.innerHTML;
                // get all stylesheets except the stick ones (which will be loaded by the time the html gets rendered) otherwise we could be loading them twice
                const stylesheets = getStylesheets(head).filter(l => l.dataset.sticky !== "true").map(l => l.outerHTML).join("");

                // pending native calls can now be resolved, first html snapshot was grabbed
                renderTask!.setResult();

                localStorage.setItem(componentCacheKey, stylesheets + elementHtml); // insert html into the cache

                const componentCachedInfo = localStorage.getItem(componentSource);
                const cachedEntries: string[] = componentCachedInfo ? JSON.parse(componentCachedInfo) : [];

                // remove cached entries that are older tomantina cache size within limits
                while (cachedEntries.length >= maxPreRenderedCacheEntries) {
                    const olderCacheEntryKey = cachedEntries.shift() as string;
                    localStorage.removeItem(getComponentCacheKey(olderCacheEntryKey));
                }

                cachedEntries.push(componentHash);
                localStorage.setItem(componentSource, JSON.stringify(cachedEntries));
            }

            window.dispatchEvent(new Event("viewready"));

            notifyViewLoaded(view.name, view.id.toString());
        } catch (error) {
            handleError(error, view!);
        }
    }

    innerLoad();
}

async function bootstrap() {
    function preventDroppingFiles(event: DragEvent): void {
        const containsDraggedFiles = event.dataTransfer && event.dataTransfer.types.includes("Files");
        if (containsDraggedFiles) {
            event.preventDefault();
        }
    }

    window.addEventListener("dragover", preventDroppingFiles);
    window.addEventListener("drop", preventDroppingFiles);

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

    const { renderMainView } = await import("./Internal/Loader.View");
    mainView.renderHandler = component => renderMainView(component, rootElement);

    const resourceLoader = await import("./Public/ResourceLoader");
    resourceLoader.setCustomResourceBaseUrl(customResourceBaseUrl);

    bootstrapTask.setResult();

    notifyViewInitialized(mainFrameName);
}

async function loadFramework(): Promise<void> {
    const reactLib: string = "React";
    const reactDOMLib: string = "ReactDOM";
    const externalLibsPath = libsPath + "node_modules/";

    const view = getView(mainFrameName);
    await loadScript(externalLibsPath + "prop-types/prop-types.min.js", view); /* Prop-Types */
    await loadScript(externalLibsPath + "react/umd/react.production.min.js", view); /* React */
    await loadScript(externalLibsPath + "react-dom/umd/react-dom.production.min.js", view); /* ReactDOM */

    define("react", [], () => window[reactLib]);
    define("react-dom", [], () => window[reactDOMLib]);
}

bootstrap();