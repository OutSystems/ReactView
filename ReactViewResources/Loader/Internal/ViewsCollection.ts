import { ViewMetadata } from "./ViewMetadata";
import { modulesFunctionName } from "./Environment";

const views = new Map<string, ViewMetadata>();

export function addView(name: string, view: ViewMetadata): void {
    views.set(name, view);
}

export function deleteView(name: string): void {
    views.delete(name);
}

export function tryGetView(viewName: string): ViewMetadata | null {
    return views.get(viewName) || null;
}

export function getView(viewName: string): ViewMetadata {
    const view = tryGetView(viewName);
    if (!view) {
        throw new Error(`View "${viewName}" not loaded`);
    }
    return view;
}

window[modulesFunctionName] = function getModule(viewName: string, id: string, moduleName: string) {
    const view = views.get(viewName);
    if (view && view.id.toString() === id) {
        // when generation requested != current generation, ignore (we don't want to interact with old views)
        const module = view.modules.get(moduleName);
        if (module) {
            return module;
        }
    }

    return new Proxy({}, {
        get: function () {
            // return a dummy function, call will be ingored, but no exception thrown
            return new Function();
        }
    });
};