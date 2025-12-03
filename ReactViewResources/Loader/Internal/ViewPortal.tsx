import * as React from "react";
import { webViewRootId } from "../Internal/Environment";
import { getStylesheets } from "./Common";
import { ViewMetadata } from "./ViewMetadata";
import { ViewSharedContext } from "../Public/ViewSharedContext";
import {addView, deleteView} from "./ViewsCollection";
import {notifyViewDestroyed, notifyViewInitialized} from "./NativeAPI";
import {handleError} from "./ErrorHandler";

export type ViewLifecycleEventHandler = (view: ViewMetadata) => void;
export type ViewErrorHandler = (view: ViewMetadata, error: Error) => void;

export interface IViewPortalProps {
    view: ViewMetadata
    shadowRoot: Element;
}

interface IViewPortalState {
    component: React.ReactElement;
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

/**
 * A ViewPortal is were a view is rendered. The view DOM is then moved into the appropriate placeholder.
 * This way we avoid a view being recreated (and losing state) when its ViewFrame is moved in the tree.
 * 
 * A View Frame notifies its sibling view collection when a new instance is mounted.
 * Upon mount, a View Portal is created and it will be responsible for rendering its view component in the shadow dom.
 * A view portal is persisted until its View Frame counterpart disappears.
 * */
export class ViewPortal extends React.Component<IViewPortalProps, IViewPortalState> {
    private head: HTMLElement;

    constructor(props: IViewPortalProps, context: any) {
        super(props, context);

        this.state = { component: null! };
        
        props.view.renderHandler = component => this.renderPortal(component);
    }

    private renderPortal(component: React.ReactElement) {
        const wrappedComponent = (
            <ViewSharedContext.Provider value={this.props.view.context}>
                {component}
            </ViewSharedContext.Provider>
        );
        return new Promise<void>(resolve => this.setState({ component: wrappedComponent }, resolve));
    }

    public shouldComponentUpdate(nextProps: IViewPortalProps, nextState: IViewPortalState) {
        // only update if the component was set (once)
        return this.state.component === null && nextState.component !== this.state.component;
    }

    public componentDidMount() {
        this.props.view.head = this.head;
        
        const styleResets = document.createElement("style");
        styleResets.innerHTML = ":host { all: initial; display: block; }";

        this.head.appendChild(styleResets);

        // get sticky stylesheets
        const stylesheets = getStylesheets(document.head).filter(s => s.dataset.sticky === "true");
        stylesheets.forEach(s => this.head.appendChild(document.importNode(s, true)));

        onChildViewAdded(this.props.view);
    }

    public componentWillUnmount() {
        onChildViewRemoved(this.props.view);
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // execute error handling inside promise, to avoid the error handler to rethrow exception inside componentDidCatch
        Promise.resolve(null).then(() => onChildViewErrorRaised(this.props.view, error));
    }

    public render(): React.ReactNode {
        return ReactDOM.createPortal(
            <>
                <head ref={e => this.head = e!}>
                </head>
                <body>
                    <div id={webViewRootId} ref={e => this.props.view.root = e!}>
                        {this.state.component ? this.state.component : null}
                    </div>
                </body>
            </>,
            this.props.shadowRoot);
    }
}
