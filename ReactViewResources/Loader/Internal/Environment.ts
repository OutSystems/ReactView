export const [
    libsPath,
    isDebugModeEnabled,
    modulesFunctionName,
    nativeAPIObjectName,
    customResourceBaseUrl,
    devServerBaseUrl // root url of the ReactView dev server when the host runs against one, e.g. http://localhost:8080/
] = (() => {
    const params = Array.from(new URLSearchParams(location.search).keys());
    return params.map(v => v === "false" ? "" : v);
})();

export const defaultLoadResourcesTimeout = (isDebugModeEnabled ? 60 : 10) * 1000; // ms

export const mainFrameName = "";
export const webViewRootId = "webview_root";