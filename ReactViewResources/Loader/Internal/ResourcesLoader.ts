import { defaultLoadResourcesTimeout, isDebugModeEnabled, mainFrameName } from "./Environment";
import { showWarningMessage } from "./MessagesProvider";
import { Task } from "./Task";
import { ViewMetadata } from "./ViewMetadata";
import { getView } from "./ViewsCollection";

export function loadScript(scriptSrc: string, view: ViewMetadata): Promise<void> {
    return new Promise(async (resolve) => {
        const frameScripts = view.scriptsLoadTasks;

        // check if script was already added, fallback to main frame
        const scriptLoadTask = frameScripts.get(scriptSrc) || !view.isMain ? getView(mainFrameName).scriptsLoadTasks.get(scriptSrc) : null;
        if (scriptLoadTask) {
            // wait for script to be loaded
            await scriptLoadTask.promise;
            resolve();
            return;
        }

        const loadTask = new Task<void>();
        frameScripts.set(scriptSrc, loadTask);

        const script = document.createElement("script");
        script.src = scriptSrc;

        waitForLoad(script, scriptSrc, defaultLoadResourcesTimeout)
            .then(() => {
                loadTask.setResult();
                resolve();
            });

        if (!view.head) {
            throw new Error(`View ${view.name} head is not set`);
        }
        view.head.appendChild(script);
    });
}

export function loadStyleSheet(stylesheet: string, containerElement: Element, markAsSticky: boolean): Promise<HTMLLinkElement> {
    return new Promise((resolve) => {
        const link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = stylesheet;
        if (markAsSticky) {
            link.dataset.sticky = "true";
        }

        waitForLoad(link, stylesheet, defaultLoadResourcesTimeout)
            .then(resolve);

        containerElement.appendChild(link);
    });
}

function waitForLoad<T extends HTMLElement>(element: T, url: string, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
        // const timeoutHandle = setTimeout(
        //     () => {
        //         if (isDebugModeEnabled) {
        //             showWarningMessage(`Timeout loading resouce: '${url}'. If you paused the application to debug, you may disregard this message.`);
        //         }
        //     },
        //     timeout);

        // element.addEventListener("load", () => {
        //     clearTimeout(timeoutHandle);
        //     resolve(element);
        // });

        let timeoutHandle: number | undefined;

        // Define handlers ahead of time
        const loadHandler = () => {
            cleanup();
            resolve(element);
        };

        const errorHandler = () => {
            cleanup();
            reject(new Error(`Failed to load resource: '${url}'`));
        };

        // This central function is key to disposing of everything
        const cleanup = () => {
            clearTimeout(timeoutHandle);
            element.removeEventListener("load", loadHandler);
            element.removeEventListener("error", errorHandler);
        };

        // Set the timeout to reject the promise and clean up
        timeoutHandle = setTimeout(() => {
            cleanup();
            const message = `Timeout loading resource: '${url}'.`;
            if (isDebugModeEnabled) {
                showWarningMessage(`${message} If you paused the application to debug, you may disregard this message.`);
            }
            reject(new Error(message));
        }, timeout);
        
        element.addEventListener("load", loadHandler);
        element.addEventListener("error", errorHandler);
    });
}