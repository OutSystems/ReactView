import * as Environment from "./Environment";

let layer: HTMLDivElement;
let disableCounter = 0;

export function disableInputInteractions(disable: boolean) {
    if (disable) {
        disableCounter++;
        if (disableCounter > 1) {
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

        //alert(Environment.disableKeyboardCallback + "1");
        document.body.appendChild(layer);
    } else {
        if (disableCounter === 1) {
            // going 0
            //alert(Environment.disableKeyboardCallback + "0");
            document.body.removeChild(layer);
        }
        disableCounter = Math.max(0, disableCounter - 1);
    }
}