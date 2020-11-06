import { disableInputInteractions } from "./InputManager";
import { bindNativeObject } from "./NativeAPI";
import { Task } from "./Task";

interface PromiseWithFinally<T> extends Promise<T> {
    finally(onFinally: () => void);
}

export const syncFunction = new Object();

export function createPropertiesProxy(objProperties: {}, nativeObjName: string, componentRenderedWaitTask?: Task<void>): {} {
    const proxy = Object.assign({}, objProperties);
    Object.keys(proxy).forEach(key => {
        const value = objProperties[key];
        const isSyncFunction = value === syncFunction;
        if (value !== undefined && !isSyncFunction) {
            proxy[key] = value;
        } else {
            proxy[key] = async function () {
                let nativeObject = window[nativeObjName];
                if (!nativeObject) {
                    nativeObject = await new Promise(async (resolve) => {
                        const nativeObject = await bindNativeObject(nativeObjName);
                        resolve(nativeObject);
                    });
                }

                let result: PromiseWithFinally<any> | undefined = undefined;
                try {
                    if (isSyncFunction) {
                        disableInputInteractions(true);
                    }

                    result = nativeObject[key].apply(window, arguments);
                } finally {
                    if (isSyncFunction) {
                        if (result) {
                            result.finally(() => disableInputInteractions(false));
                        } else {
                            disableInputInteractions(false);
                        }
                    }
                }

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