import { bindNativeObject } from "./NativeAPI";
import { getBailOutOnUnboundNativeObjectCallsFlag } from "./Flags";
import { Task } from "./Task";

export function createPropertiesProxy(rootElement: Element, objProperties: {}, nativeObjName: string, componentRenderedWaitTask?: Task<void> | null): {} {
    const proxy = Object.assign({}, objProperties);
    Object.keys(proxy).forEach(key => {
        const value = objProperties[key];
        if (value !== undefined) {
            proxy[key] = value;
        } else {
            proxy[key] = async function () {
                if (!getBailOutOnUnboundNativeObjectCallsFlag()) {
                    return invokeNative(nativeObjName, key, arguments, componentRenderedWaitTask, /*bailOut*/ false);
                }

                try {
                    return await invokeNative(nativeObjName, key, arguments, componentRenderedWaitTask, /*bailOut*/ true);
                } catch (error) {
                    // remount / teardown races: the view is still calling in while CefGlue has already
                    // unregistered the object (rejects with a plain string from NativeObjectMethodDispatcher)
                    if (isUnboundNativeObjectError(error)) {
                        return;
                    }
                    throw error;
                }
            };
        }
    });
    return proxy;
}

async function invokeNative(
    nativeObjName: string,
    key: string,
    args: IArguments,
    componentRenderedWaitTask: Task<void> | null | undefined,
    bailOut: boolean
): Promise<any> {
    const nativeObject = window[nativeObjName] || await bindNativeObject(nativeObjName);
    const method = nativeObject && nativeObject[key];

    if (bailOut && typeof method !== "function") {
        return;
    }

    const result = method.apply(window, args);

    if (componentRenderedWaitTask) {
        // wait until component is rendered, first render should only render static data
        await componentRenderedWaitTask.promise;
    }

    return result;
}

function isUnboundNativeObjectError(error: unknown): boolean {
    const message = typeof error === "string" ? error : error instanceof Error ? error.message : String(error);
    // CefGlue rejects method calls with a plain string from NativeObjectMethodDispatcher; bind can fail
    // the same way when the object will never come back
    return (message.indexOf("was not found") >= 0 && message.indexOf("registered before") >= 0)
        || message.indexOf("Failed to create native object") >= 0;
}
