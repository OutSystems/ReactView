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
    return new Promise((resolve) => {
        const timeoutHandle = setTimeout(
            () => {
                if (isDebugModeEnabled) {
                    showWarningMessage(`Timeout loading resouce: '${url}'. If you paused the application to debug, you may disregard this message.`);
                }
            },
            timeout);

        element.addEventListener("load", () => {
            clearTimeout(timeoutHandle);
            resolve(element);
        });
    });
}