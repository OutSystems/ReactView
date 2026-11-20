import * as React from "react";
import * as ReactDOM from "react-dom";
import { ViewMetadataContext } from "../Internal/ViewMetadataContext";
import { PluginsContext, PluginsContextHolder } from "../Public/PluginsContext";
import { formatUrl, ResourceLoader } from "../Public/ResourceLoader";
import { ViewMetadata } from "./ViewMetadata";

export function createView(componentClass: any, properties: {}, view: ViewMetadata, componentName: string) {
    componentClass.contextType = PluginsContext;
    const makeResourceUrl = (resourceKey: string, ...params: string[]) => formatUrl(view.name, resourceKey, ...params);

    return (
        <ViewMetadataContext.Provider value={view}>
            <PluginsContext.Provider value={new PluginsContextHolder(Array.from(view.modules.values()))}>
                <ResourceLoader.Provider value={makeResourceUrl}>
                    {React.createElement(componentClass, { ref: e => view.modules.set(componentName, e), ...properties })}
                </ResourceLoader.Provider>
            </PluginsContext.Provider>
        </ViewMetadataContext.Provider>
    );
}

export function renderMainView(children: React.ReactElement, container: Element) {
    // hydrate over the pre-rendered html of the cache; a plain render otherwise (and on re-renders)
    const render = container.hasChildNodes() && !container["__reactViewRendered"] ? ReactDOM.hydrate : ReactDOM.render;
    container["__reactViewRendered"] = true;
    return new Promise<void>(resolve => render(children, container, resolve));
}
