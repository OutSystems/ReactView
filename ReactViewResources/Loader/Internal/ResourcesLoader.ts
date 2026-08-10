import { defaultLoadResourcesTimeout, isDebugModeEnabled, mainFrameName } from "./Environment";
import { showWarningMessage } from "./MessagesProvider";
import { Task } from "./Task";
import { ViewMetadata } from "./ViewMetadata";
import { getLoadScriptsOncePerDocumentFlag } from "./Flags";
import { getView } from "./ViewsCollection";

// inner views are shadow roots rather than frames, and shadow dom encapsulates styles but not scripts, so
// a script that has been appended for one view has executed for every other one as well. tracking these
// per view re-executes the same bundle once per view.
const scriptLoadTasks = new Map<string, Task<void>>();

export function loadScript(scriptSrc: string, view: ViewMetadata): Promise<void> {
    // bootstrap runs before the flag is set, but it only loads scripts for the main view, whose head is the
    // document head and whose per view map is the one the legacy path reads, so both paths behave alike there
    if (!getLoadScriptsOncePerDocumentFlag()) {
        return loadScriptPerView(scriptSrc, view);
    }

    const pendingLoad = scriptLoadTasks.get(scriptSrc);
    if (pendingLoad) {
        return pendingLoad.promise;
    }

    const loadTask = new Task<void>();
    scriptLoadTasks.set(scriptSrc, loadTask);

    const script = document.createElement("script");
    script.src = scriptSrc;

    // a script that fails is dropped, so that a later view can attempt it again. one that times out is
    // kept, since it may still arrive
    waitForLoad(script, scriptSrc, defaultLoadResourcesTimeout, () => scriptLoadTasks.delete(scriptSrc))
        .then(() => loadTask.setResult());

    // not the requesting view's head: it may already be detached, and a script in a detached tree never
    // runs, so the task above would neither resolve nor fail
    document.head.appendChild(script);

    return loadTask.promise;
}

/**
 * Pre 5.120.5 behaviour, kept behind LoadScriptsOncePerDocument so that it can be restored. Reproduced as it
 * was, quirks included: the condition below reads as (ownTask || !isMain) ? mainFrameTask : null, so the
 * view's own entry is only ever a truthiness test and inner views never reuse what they registered.
 */
function loadScriptPerView(scriptSrc: string, view: ViewMetadata): Promise<void> {
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

function waitForLoad<T extends HTMLElement>(element: T, url: string, timeout: number, onFailed?: () => void): Promise<T> {
    return new Promise((resolve) => {
        const timeoutHandle = setTimeout(
            () => {
                if (isDebugModeEnabled) {
                    showWarningMessage(`Timeout loading resouce: '${url}'. If you paused the application to debug, you may disregard this message.`);
                }
            },
            timeout);

        // both listeners capture the element, so whichever outcome happens first has to remove them. the
        // timeout only warns and never cleans up, so a resource that loads after it still resolves.
        function cleanup(): void {
            clearTimeout(timeoutHandle);
            element.removeEventListener("load", onLoad);
            element.removeEventListener("error", onError);
        }

        function onLoad(): void {
            cleanup();
            resolve(element);
        }

        // a failed resource is not reported back, since no caller handles one today
        function onError(): void {
            cleanup();
            if (onFailed) {
                onFailed();
            }
        }

        element.addEventListener("load", onLoad);
        element.addEventListener("error", onError);
    });
}