import * as React from "react";
import * as ReactDOM from "react-dom";
import { ViewContext } from "../Internal/ViewContext";
import { PluginsContext, PluginsContextHolder } from "../Public/PluginsContext";
import { formatUrl, ResourceLoader } from "../Public/ResourceLoader";
import { handleError } from "./ErrorHandler";
import { notifyViewDestroyed, notifyViewInitialized } from "./NativeAPI";
import { ViewMetadata } from "./ViewMetadata";
import { ViewPortalsCollection } from "./ViewPortalsCollection";
import { addView, deleteView } from "./ViewsCollection";

export function createView(componentClass: any, properties: {}, view: ViewMetadata, componentName: string) {
    componentClass.contextType = PluginsContext;

    const makeResourceUrl = (resourceKey: string, ...params: string[]) => formatUrl(view.name, resourceKey, ...params);

    return (
        <ViewContext.Provider value={view}>
            <PluginsContext.Provider value={new PluginsContextHolder(Array.from(view.modules.values()))}>
                <ResourceLoader.Provider value={makeResourceUrl}>
                    <ViewPortalsCollection views={view.childViews}
                        viewAdded={onChildViewAdded}
                        viewRemoved={onChildViewRemoved}
                        viewErrorRaised={onChildViewErrorRaised} />
                    {React.createElement(componentClass, { ref: e => view.modules.set(componentName, e), ...properties })}
                </ResourceLoader.Provider>
            </PluginsContext.Provider>
        </ViewContext.Provider>
    );
}

export function renderMainView(children: React.ReactElement, container: Element): Promise<void> {
    return new Promise<void>(resolve => ReactDOM.hydrate(children, container, resolve));
}

function onChildViewAdded(childView: ViewMetadata) {
    addView(childView.name, childView);
    notifyViewInitialized(childView.name);
}

function onChildViewRemoved(childView: ViewMetadata) {
    deleteView(childView.name);
    notifyViewDestroyed(childView.name);
}

function onChildViewErrorRaised(childView: ViewMetadata, error: Error) {
    handleError(error, childView);
}
