let layer: HTMLDivElement;
let disableInputCounter = 0;

export function disableInputInteractions(disable: boolean) {
    if (disable) {
        disableInputCounter++;
        if (disableInputCounter > 1) {
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
    } else {
        if (disableInputCounter === 1) {
            // going 0
            document.body.removeChild(layer);
        }
        disableInputCounter = Math.max(0, disableInputCounter - 1);
    }
}