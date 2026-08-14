import { bindNativeObject } from "./NativeAPI";
import { getBailOutOnUnboundNativeObjectCallsFlag } from "./Flags";
import { Task } from "./Task";
import { ViewMetadata } from "./ViewMetadata";

export function createPropertiesProxy(rootElement: Element, objProperties: {}, nativeObjName: string, view: ViewMetadata, componentRenderedWaitTask?: Task<void> | null): {} {
    const proxy = Object.assign({}, objProperties);
    Object.keys(proxy).forEach(key => {
        const value = objProperties[key];
        if (value !== undefined) {
            proxy[key] = value;
        } else {
            proxy[key] = async function () {
                // read per call: the proxy outlives the view, and what it should do about a call that
                // arrives after the view is gone is decided by the flag in place at that moment
                if (getBailOutOnUnboundNativeObjectCallsFlag() && view.isReleased) {
                    // destroying the view is what unregisters its native objects, so there is nothing left
                    // to call into, and nobody left to receive what the call would have returned
                    logUnboundCall(nativeObjName, key, "the view was destroyed");
                    return;
                }

                // every call that gets this far belongs to a live view, and a live view that cannot reach
                // its native object is a broken channel to the presenter, not a teardown race: it has to
                // keep failing exactly as it did before this bail out existed. Dropping it would discard a
                // real user interaction and leave a view that looks alive but does nothing
                const nativeObject = window[nativeObjName] || await bindNativeObject(nativeObjName);

                const result = nativeObject[key].apply(window, arguments);

                if (componentRenderedWaitTask) {
                    // wait until component is rendered, first render should only render static data
                    await componentRenderedWaitTask.promise;
                }

                return result;
            };
        }
    });
    return proxy;
}

/**
 * A dropped call is expected while a view is being taken down, but one arriving long after that means
 * something is still holding on to a released view, and that is a bug worth finding.
 */
function logUnboundCall(nativeObjName: string, key: string, reason: string): void {
    window.console.warn(`Ignored call to "${nativeObjName}.${key}"`, reason);
}
