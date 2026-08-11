import { nativeAPIObjectName } from "./Environment";

interface INativeObject {
    notifyViewInitialized(frameName: string): void;
    notifyViewLoaded(frameName: string, id: string): void;
    notifyViewDestroyed(frameName: string): void;
}

declare const cefglue: {
    checkObjectBound(objName: string): Promise<boolean>
};

function withAPI(action: (api: INativeObject) => void): void {
    const api = window[nativeAPIObjectName];
    if (api) {
        action(api);
    } else {
        bindNativeObject(nativeAPIObjectName).then(action);
    }
}

export async function bindNativeObject<T>(nativeObjectName: string): Promise<T> {
    await cefglue.checkObjectBound(nativeObjectName);

    const nativeObject = window[nativeObjectName] as T;
    if (!nativeObject) {
        // An object that never bound, or that was unbound along with the view holding it, is handed over
        // missing otherwise, and each caller then fails on its own: the properties proxy on the method it was
        // asked for, the plugins on the instance they build with it. By then the name is gone, and what the
        // console reports is a property read on undefined somewhere inside the bundle.
        throw new Error(`The native object "${nativeObjectName}" is not bound. The view holding it was most likely already destroyed.`);
    }

    return nativeObject;
}

export function notifyViewInitialized(viewName: string): void {
    withAPI(api => api.notifyViewInitialized(viewName));
}

export function notifyViewLoaded(viewName: string, id: string): void {
    withAPI(api => api.notifyViewLoaded(viewName, id));
}

export function notifyViewDestroyed(viewName: string): void {
    withAPI(api => api.notifyViewDestroyed(viewName));
}