import { nativeAPIObjectName } from "./Environment";

interface INativeObject {
    notifyViewInitialized(frameName: string): void;
    notifyViewLoaded(frameName: string, id: string): void;
    notifyViewDestroyed(frameName: string): void;
}

interface IObjectBinder {
    checkObjectBound(objName: string): Promise<boolean>;
}

// the bindings of the native objects are exposed by the web engine: webviewBridge with the
// system engines (WKWebView on macOS, WebView2 on Windows), cefglue with CEF
declare const webviewBridge: IObjectBinder | undefined;
declare const cefglue: IObjectBinder;

function getObjectBinder(): IObjectBinder {
    return typeof webviewBridge !== "undefined" ? webviewBridge : cefglue;
}

function withAPI(action: (api: INativeObject) => void): void {
    const api = window[nativeAPIObjectName];
    if (api) {
        action(api);
    } else {
        bindNativeObject(nativeAPIObjectName).then(action);
    }
}

export async function bindNativeObject<T>(nativeObjectName: string): Promise<T> {
    await getObjectBinder().checkObjectBound(nativeObjectName);
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