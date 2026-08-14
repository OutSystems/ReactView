import { bindNativeObject } from "./NativeAPI";
import { getBailOutOnUnboundNativeObjectCallsFlag } from "./Flags";
import { Task } from "./Task";
import { ViewMetadata } from "./ViewMetadata";

export function createPropertiesProxy(rootElement: Element, objProperties: {}, nativeObjName: string, view: ViewMetadata, voidNativeObjectMethods: string[], componentRenderedWaitTask?: Task<void> | null): {} {
    // only a call that returns nothing can be dropped. Dropping one that returns a value resolves it with
    // undefined, which the caller then reads and stores, so the teardown race stops being an error here and
    // becomes one somewhere else, further away from its cause. A method the host said nothing about is
    // treated as returning a value, the safe default: it keeps failing exactly as it did before the bail out
    const voidMethods = new Set(voidNativeObjectMethods || []);

    const proxy = Object.assign({}, objProperties);
    Object.keys(proxy).forEach(key => {
        const value = objProperties[key];
        if (value !== undefined) {
            proxy[key] = value;
        } else {
            proxy[key] = async function () {
                // read per call: the proxy outlives the view, and what it should do about a call that
                // arrives after the view is gone is decided by the flag in place at that moment
                const bailOut = getBailOutOnUnboundNativeObjectCallsFlag() && voidMethods.has(key);

                if (bailOut && view.isReleased) {
                    // destroying the view is what unregisters its native objects, so there is nothing
                    // left to call into
                    logUnboundCall(nativeObjName, key, "the view was destroyed");
                    return;
                }

                try {
                    return await invokeNative(nativeObjName, key, arguments, componentRenderedWaitTask, bailOut);
                } catch (error) {
                    // teardown races: the object is still on the window while the host has already
                    // unregistered it, and the call is rejected on arrival
                    if (bailOut && isUnboundNativeObjectError(error)) {
                        logUnboundCall(nativeObjName, key, error);
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

    if (bailOut && (!nativeObject || typeof nativeObject[key] !== "function")) {
        // unregistering an object deletes it from the window but leaves its binding task behind, already
        // resolved from the first registration, so binding it again succeeds and hands back nothing
        logUnboundCall(nativeObjName, key, "the object is no longer bound");
        return;
    }

    const result = nativeObject[key].apply(window, args);

    if (componentRenderedWaitTask) {
        // wait until component is rendered, first render should only render static data
        await componentRenderedWaitTask.promise;
    }

    return result;
}

/**
 * A dropped call is usually a teardown race, but a native object that was never registered looks exactly
 * the same from this side, and that one is a bug worth finding.
 */
function logUnboundCall(nativeObjName: string, key: string, reason: unknown): void {
    window.console.warn(`Ignored call to "${nativeObjName}.${key}"`, reason);
}

function isUnboundNativeObjectError(error: unknown): boolean {
    // the call is rejected with a plain string, "Object named X was not found. Make sure it was registered
    // before.", raised by cef's NativeObjectMethodDispatcher when the object is no longer registered
    const message = typeof error === "string" ? error : error instanceof Error ? error.message : String(error);
    return message.includes("was not found") && message.includes("registered before");
}
