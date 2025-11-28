import * as React from "react";
import "./UIEditor.scss";
import {createRef, useEffect, useRef} from "react";
import {TaskUI} from "./Component/TaskUI";

type Action = () => void;

export interface IUIEditorProperties {
    
}

const UIEditorLike = ({}: IUIEditorProperties): JSX.Element => {
    const editorWrapper = createRef<HTMLDivElement | null>();
    const disposeHandlers = useRef<Action[]>([]);

    useEffect(() => {
        if (!editorWrapper.current) return () => {};
        
        let cancelled = false;

        const setup = async (localDoc: HTMLDocument, wrapper: HTMLElement, level: number) => {
            let iframe: HTMLIFrameElement | null = null;
            iframe = localDoc.createElement("iframe");
            iframe.src = "/Sample.Avalonia/sample.html";
            iframe.style.border = "0";
            iframe.style.height = "100%";
            iframe.style.width = "100%";

            const iframeLoadTask = new TaskUI<void>();
            const onLoad = () => iframeLoadTask.setResult();
            iframe.addEventListener("load", onLoad, { once: true });

            wrapper!.appendChild(iframe);

            disposeHandlers.current.push(() => {
                localDoc.head.innerHTML = "";

                // 2️⃣ Break contentWindow references BEFORE touching contentDocument
                const win = iframe.contentWindow;
                if (win && !win.closed) {
                    try { win.location.replace("about:blank"); } catch {}
                }
                
                iframe.removeEventListener("load", onLoad);
                iframe.src = "about:blank"; // ensures unload event fires
                const doc = iframe.contentDocument;
                if (doc) {
                    doc.open();
                    doc.write("");
                    doc.close();
                }
                iframe.remove(); // safer modern removal
                
                // 4️⃣ Close the window context if possible
                iframe.contentWindow?.close?.();
                iframe.onload = null;
                iframe = null;
            });

            await iframeLoadTask.promise;
            if (cancelled || !iframe?.contentDocument) return;

            const doc = iframe.contentDocument;
            if(level > 1) setup(doc, doc.body, level - 1);
            const body = doc.body as HTMLBodyElement;
            body.className = "root-with-iframe";
        };

        setup(document, editorWrapper.current, 1);

        return () => {
            cancelled = true;
            disposeHandlers.current.forEach(h => h());
            disposeHandlers.current.length = 0;
            console.log("unmounted and cleaned iframe");
        };
    }, []);
    
    return (
        <div ref={editorWrapper} className="ui-editor-wrapper" />
    );    
}

export default UIEditorLike;