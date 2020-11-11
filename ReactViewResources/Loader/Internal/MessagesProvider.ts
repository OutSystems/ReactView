import { waitForDOMReady } from "./Common";

export function showErrorMessage(msg: string, targetElement?: HTMLElement): void {
    showMessage(msg, true, targetElement);
}

export function showWarningMessage(msg: string, targetElement?: HTMLElement): void {
    showMessage(msg, false, targetElement);
}

async function showMessage(msg: string, isError: boolean, targetElement?: HTMLElement) {
    const containerId = "webview_error";
    let msgContainer = document.getElementById(containerId) as HTMLDivElement;
    if (!msgContainer) {
        msgContainer = document.createElement("div");
        msgContainer.id = containerId;
        const style = msgContainer.style;
        style.backgroundColor = isError ? "#f45642" : "#f4b942";
        style.color = "white";
        style.fontFamily = "Arial";
        style.fontWeight = "bold";
        style.fontSize = "10px"
        style.padding = "3px";
        style.position = "relative";
        style.top = "0";
        style.left = "0";
        style.right = "0";
        style.zIndex = "10000";
        style.height = "auto";
        style.wordWrap = "break-word";
        style.visibility = "visible";

        await waitForDOMReady();
        (targetElement || document.body).appendChild(msgContainer);
    }
    msgContainer.innerText = msg;

    if (!isError) {
        setTimeout(() => {
            msgContainer.style.visibility = "collapsed";
        }, 30000);
    }
}