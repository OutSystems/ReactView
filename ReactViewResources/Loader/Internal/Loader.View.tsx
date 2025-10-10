import * as React from "react";
import * as ReactDOM from "react-dom";
import { ViewMetadataContext } from "../Internal/ViewMetadataContext";
import { PluginsContext, PluginsContextHolder } from "../Public/PluginsContext";
import { formatUrl, ResourceLoader } from "../Public/ResourceLoader";
import { handleError } from "./ErrorHandler";
import { notifyViewDestroyed, notifyViewInitialized } from "./NativeAPI";
import { ViewMetadata } from "./ViewMetadata";
import { ViewPortalsCollection } from "./ViewPortalsCollection";
import { addView, deleteView } from "./ViewsCollection";

export function createView(componentClass: any, properties: {}, view: ViewMetadata, componentName: string) {
    return <View componentClass={componentClass} properties={properties} view={view} componentName={componentName} />;
}

interface IViewProps {
    componentClass: any;
    properties: {};
    view: ViewMetadata;
    componentName: string
}

const View = ({ componentClass, properties, view, componentName }: IViewProps) => {
    componentClass.contextType = PluginsContext;
    const makeResourceUrl = (resourceKey: string, ...params: string[]) => formatUrl(view.name, resourceKey, ...params);

    const pluginsContext = React.useRef(new PluginsContextHolder(Array.from(view.modules.values())));
    
    React.useEffect(() => {
        return () => {
            console.log("unmounting view", view.name);
            pluginsContext.current = null!;
        }
    }, []);
    
    return (
        <ViewMetadataContext.Provider value={view}>
            <PluginsContext.Provider value={pluginsContext.current}>
                <ResourceLoader.Provider value={makeResourceUrl}>
                    {React.createElement(componentClass, { ref: e => view.modules.set(componentName, e), ...properties })}
                </ResourceLoader.Provider>
            </PluginsContext.Provider>
        </ViewMetadataContext.Provider>
    );
}

export function renderMainView(children: React.ReactElement, container: Element) {
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
