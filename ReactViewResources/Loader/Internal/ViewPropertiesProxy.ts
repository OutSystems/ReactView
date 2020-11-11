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