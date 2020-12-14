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
    let api = window[nativeAPIObjectName];
    if (api) {
        action(api);
    } else {
        bindNativeObject(nativeAPIObjectName).then(action);
    }
}

export async function bindNativeObject<T>(nativeObjectName: string): Promise<T> {
    await cefglue.checkObjectBound(nativeObjectName);
    return window[nativeObjectName] as T;
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