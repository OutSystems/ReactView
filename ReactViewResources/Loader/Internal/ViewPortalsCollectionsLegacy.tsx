import * as React from "react";
import { ObservableListCollection } from "./ObservableCollection";
import { ViewMetadata } from "./ViewMetadata";
import { ViewPortalLegacy, ViewLifecycleEventHandler, ViewErrorHandler } from "./ViewPortalLegacy";
export { ViewLifecycleEventHandler, ViewErrorHandler } from "./ViewPortal";

interface IViewPortalsCollectionProps {
    views: ObservableListCollection<ViewMetadata>;
    viewAdded: ViewLifecycleEventHandler;
    viewRemoved: ViewLifecycleEventHandler;
    viewErrorRaised: ViewErrorHandler;
}

/**
 * Handles notifications from the views collection. Whenever a view is added or removed
 * the corresponding ViewPortal is added or removed
 * */
export class ViewPortalsCollectionLegacy extends React.Component<IViewPortalsCollectionProps> {

    constructor(props: IViewPortalsCollectionProps, context: any) {
        super(props, context);
        props.views.addChangedListener(() => this.forceUpdate());
    }

    public shouldComponentUpdate() {
        return false;
    }

    private renderViewPortal(view: ViewMetadata) {
        return (
            <ViewPortalLegacy key={view.name}
                view={view}
                viewMounted={this.props.viewAdded}
                viewUnmounted={this.props.viewRemoved}
                viewErrorRaised={this.props.viewErrorRaised} />
        );
    }

    public render(): React.ReactNode {
        return this.props.views.items.sort((a, b) => a.name.localeCompare(b.name)).map(view => this.renderViewPortal(view));
    }
}