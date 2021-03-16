/// <reference path="./../../ViewGenerator/contentFiles/global.d.ts"/>

import { getPluginModule, getViewModule, waitForNextPaint } from "./Internal/Common";
import { renderCachedView, storeViewRenderInCache } from "./Internal/ComponentsRenderCache";
import { mainFrameName } from "./Internal/Environment";
import { handleError } from "./Internal/ErrorHandler";
import { renderMainView } from "./Internal/Loader.View";
import { bindNativeObject, notifyViewInitialized, notifyViewLoaded } from "./Internal/NativeAPI";
import { loadScript, loadStyleSheet } from "./Internal/ResourcesLoader";
import { Task } from "./Internal/Task";
import { ViewMetadata } from "./Internal/ViewMetadata";
import { createPropertiesProxy } from "./Internal/ViewPropertiesProxy";
import { addView, getView, tryGetView } from "./Internal/ViewsCollection";

export { disableMouseInteractions, enableMouseInteractions } from "./Internal/InputManager";
export { showErrorMessage } from "./Internal/MessagesProvider";

const bootstrapTask = new Task();
const defaultStylesheetLoadTask = new Task();

function getViewInfo(view: ViewMetadata): View {
    function getChildrenViewInfo(view: ViewMetadata): View {
        return {
            root: view.root as Element,
            getChildren: () => view.childViews.items.map(c => getChildrenViewInfo(c))
        };
    }
    return getChildrenViewInfo(view);
}

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

            view = tryGetView(frameName)!;
            if (!view) {
                return; // was probably unloaded
            }

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

                    const plugin: IPlugin<any> = module.default;
                    view.modules.set(moduleName, new plugin(pluginNativeObject, view.root as HTMLElement, view.viewLoadTask.promise, getViewInfo(view)));
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

    async function innerLoad() {
        let view: ViewMetadata;
        try {
            if (hasStyleSheet) {
                // wait for the stylesheet to load before first render
                await defaultStylesheetLoadTask.promise;
            }

            view = tryGetView(frameName)!;
            if (!view) {
                return; // view was probably unloaded
            }

            const head = view.head;
            const rootElement = view.root;

            if (!rootElement || !head) {
                throw new Error(`View ${view.name} head or root is not set`);
            }

            const cacheEntry = maxPreRenderedCacheEntries > 0 ? await renderCachedView(view, componentSource, componentHash) : null;

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

            const renderFinishedTask = cacheEntry ? view.viewLoadTask : null;
            // create proxy for properties obj to delay its methods execution until native object is ready
            const properties = createPropertiesProxy(rootElement, componentNativeObject, componentNativeObjectName, renderFinishedTask);
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

            if (cacheEntry) {
                storeViewRenderInCache(view, cacheEntry, maxPreRenderedCacheEntries); // dont need to await
            }

            // queue view loaded notification to run after all other pending promise notifications (ensure order)
            view.viewLoadTask.promise.then(() => notifyViewLoaded(view.name, view.id.toString()));

            // pending native calls can now be resolved, first html snapshot was grabbed
            view.viewLoadTask.setResult();

        } catch (error) {
            handleError(error, view!);
        }
    }

    innerLoad();
}

export function initialize(mainView: ViewMetadata) {
    function preventDroppingFiles(event: DragEvent): void {
        const containsDraggedFiles = event.dataTransfer && event.dataTransfer.types.includes("Files");
        if (containsDraggedFiles) {
            event.preventDefault();
        }
    }

    window.addEventListener("dragover", preventDroppingFiles);
    window.addEventListener("drop", preventDroppingFiles);

    addView(mainFrameName, mainView);
    mainView.renderHandler = component => renderMainView(component, mainView.root!);

    notifyViewInitialized(mainFrameName);

    bootstrapTask.setResult();
}