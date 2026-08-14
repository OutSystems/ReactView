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
    const bound = await cefglue.checkObjectBound(nativeObjectName);
    const nativeObject = window[nativeObjectName];
    if (!bound || nativeObject === undefined) {
        // resolving undefined instead would only move the failure to whoever dereferences it, where it
        // reads as "cannot read properties of undefined" and names the method rather than the object
        throw new Error(`Native object "${nativeObjectName}" is not bound. It was either never registered or unregistered already.`);
    }
    return nativeObject as T;
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