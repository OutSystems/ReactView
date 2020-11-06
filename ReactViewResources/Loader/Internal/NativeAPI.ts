import { nativeAPIObjectName } from "./Environment";

interface INativeObject {
    notifyViewInitialized(frameName: string): void;
    notifyViewLoaded(frameName: string, id: string): void;
    notifyViewDestroyed(frameName: string): void;
}

declare const cefglue: {
    checkObjectBound(objName: string): Promise<boolean>
};

export async function bindNativeObject(nativeObjectName: string): Promise<any> {
    await cefglue.checkObjectBound(nativeObjectName);
    return window[nativeObjectName];
}

export function notifyViewInitialized(viewName: string) {
    withAPI().then(api => api.notifyViewInitialized(viewName));
}

export function notifyViewLoaded(viewName: string, id: string) {
    withAPI().then(api => api.notifyViewLoaded(viewName, id));
}

export function notifyViewDestroyed(viewName: string) {
    withAPI().then(api => api.notifyViewDestroyed(viewName));
}

async function withAPI(): Promise<INativeObject> {
    await cefglue.checkObjectBound(nativeAPIObjectName);
    return window[nativeAPIObjectName];
}