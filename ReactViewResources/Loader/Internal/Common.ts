 function getModuleFromBundle(bundleName: string, moduleName: string): any {
    const bundle = window[bundleName];
    if (bundle) {
        return bundle[moduleName];
    }
    return null;
}

export function getPluginModule(moduleName: string): any {
    return getModuleFromBundle("Plugins", moduleName);
}

export function getViewModule(moduleName: string): any {
    return getModuleFromBundle("Views", moduleName);
}

export function getStylesheets(head: Element): HTMLLinkElement[] {
    return Array.from(head.getElementsByTagName("link"));
}

export function waitForNextPaint(): Promise<void> {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            setTimeout(resolve);
        });
    });
}

export function waitForDOMReady(): Promise<void> {
    if (document.readyState === "loading") {
        return new Promise<void>((resolve) => document.addEventListener("DOMContentLoaded", () => resolve(), { once: true }));
    }
    return Promise.resolve();
}
