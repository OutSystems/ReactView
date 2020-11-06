import { isDebugModeEnabled } from "./Environment";

export const mainFrameName = "";
export const webViewRootId = "webview_root";

export function getStylesheets(head: Element): HTMLLinkElement[] {
    return Array.from(head.getElementsByTagName("link"));
}

export function waitForNextPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            setTimeout(resolve);
        });
    });
}

export function waitForDOMReady() {
    if (document.readyState === "loading") {
        return new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }
    return Promise.resolve();
}
