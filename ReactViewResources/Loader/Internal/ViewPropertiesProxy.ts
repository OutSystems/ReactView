import { bindNativeObject } from "./NativeAPI";
import { Task } from "./Task";

export function createPropertiesProxy(rootElement: Element, objProperties: {}, nativeObjName: string, componentRenderedWaitTask?: Task<void> | null): {} {
    const proxy = Object.assign({}, objProperties);
    Object.keys(proxy).forEach(key => {
        const value = objProperties[key];
        if (value !== undefined) {
            proxy[key] = value;
        } else {
            proxy[key] = async function () {
                const nativeObject = window[nativeObjName] || await bindNativeObject(nativeObjName);
                if (!nativeObject) {
                    // Reading the method off the missing object is what reports this otherwise, and by then
                    // both names are gone: what reaches the console is a property read on undefined, raised
                    // somewhere inside the bundle.
                    throw new Error(`Cannot call "${key}" on the native object "${nativeObjName}": it is not bound, and the view holding it was most likely already destroyed.`);
                }

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