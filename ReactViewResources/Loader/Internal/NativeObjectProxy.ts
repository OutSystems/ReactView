import { InputEventsManager } from "./InputManager";
import { bindNativeObject } from "./NativeAPI";
import { Semaphore } from "./Semaphore";
import { Task } from "./Task";

interface PromiseWithFinally<T> extends Promise<T> {
    finally(onFinally: () => void);
}

export const syncFunction = new Object();

export function createPropertiesProxy(rootElement: Element, objProperties: {}, nativeObjName: string, componentRenderedWaitTask?: Task<void>): {} {
    const inputEventsManager = new InputEventsManager(rootElement);
    const nativeCallsSemaphore = new Semaphore(1);
    const proxy = Object.assign({}, objProperties);
    Object.keys(proxy).forEach(key => {
        const value = objProperties[key];
        const isSyncFunction = value === syncFunction;
        if (value !== undefined && !isSyncFunction) {
            proxy[key] = value;
        } else {
            proxy[key] = async function () {
                let result: PromiseWithFinally<any> | undefined = undefined;

                try {
                    if (isSyncFunction) {
                        const currentEventTargetElement = inputEventsManager.getCurrentEventTargetElement();
                        await nativeCallsSemaphore.acquire();
                        if (currentEventTargetElement && !rootElement.contains(currentEventTargetElement)) {
                            return null;
                        }
                    }

                    const nativeObject = window[nativeObjName] || await bindNativeObject(nativeObjName);

                    result = nativeObject[key].apply(window, arguments);
                } finally {
                    if (isSyncFunction) {
                        if (result) {
                            result.finally(() => nativeCallsSemaphore.release());
                        } else {
                            nativeCallsSemaphore.release();
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