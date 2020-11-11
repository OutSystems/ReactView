let layer: HTMLDivElement;
let isMouseDisabled = false;

export function disableMouseInteractions() {
    if (isMouseDisabled) {
        return;
    }

    if (!layer) {
        layer = layer || document.createElement("div");
        layer.id = "webview_root_layer"; // used to enable styling by consumers
        layer.style.userSelect = "none";
        layer.style.height = "100vh";
        layer.style.width = "100vw";
        layer.style.position = "fixed";
        layer.style.top = "0";
        layer.style.left = "0";
        layer.style.zIndex = "2147483647";
    }

    document.body.appendChild(layer);

    isMouseDisabled = true;
}

export function enableMouseInteractions() {
    if (isMouseDisabled) {
        document.body.removeChild(layer);
        isMouseDisabled = false;
    }
}