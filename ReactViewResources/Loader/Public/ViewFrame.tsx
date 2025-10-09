import * as React from "react";
import * as ReactDOM from "react-dom";
// import { IViewFrameProps } from "ViewFrame";
import { newView, ViewMetadata } from "../Internal/ViewMetadata";
import { ViewMetadataContext } from "../Internal/ViewMetadataContext";
import { ViewSharedContext } from "./ViewSharedContext";
import { getStylesheets } from "../Internal/Common";
import {addView, deleteView} from "../Internal/ViewsCollection";
import {notifyViewDestroyed, notifyViewInitialized} from "../Internal/NativeAPI";
import {handleError} from "../Internal/ErrorHandler";
import {webViewRootId} from "../Internal/Environment";


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

// --- INTERFACES ---

// Update the props interface to formally include a 'loaded' callback
// that provides the ViewMetadata, which will contain our render handler.
export interface IViewFrameProps<T> {
    name: string | number;
    className?: string;
    context?: T;
    loaded?: () => void;
}

interface IInternalViewFrameProps<T> extends IViewFrameProps<T> {
    viewMetadata: ViewMetadata;
    context: any;
}

interface IInternalViewFrameState {
    portalMountPoint: HTMLElement | null;
    // This will hold the component passed to the renderHandler
    componentToRender: React.ReactElement | null;
}


// --- PUBLIC COMPONENT (Unchanged) ---
export class ViewFrame<T> extends React.Component<IViewFrameProps<T>, {}> {
    public render(): JSX.Element {
        return (
            <ViewMetadataContext.Consumer>
                {viewMetadata =>
                    <ViewSharedContext.Consumer>
                        {viewContext => <InternalViewFrame viewMetadata={viewMetadata} context={viewContext} {...this.props} />}
                    </ViewSharedContext.Consumer>
                }
            </ViewMetadataContext.Consumer>
        );
    }
}


// --- INTERNAL COMPONENT (Refactored for renderHandler) ---
class InternalViewFrame<T> extends React.Component<IInternalViewFrameProps<T>, IInternalViewFrameState> {
    private static generation = 0;
    private readonly generation: number;
    private placeholder: HTMLDivElement | null = null;
    private replacement: Element | null = null;

    constructor(props: IInternalViewFrameProps<T>, context: any) {
        super(props, context);

        this.state = {
            portalMountPoint: null,
            componentToRender: null, // Initialize component as null
        };

        if (props.name === "") throw new Error("View Frame name must be specified (not empty)");
        if (!/^[A-Za-z_][A-Za-z0-9_]*/.test(props.name as string)) throw new Error("View Frame name can only contain letters, numbers or _");

        this.generation = ++InternalViewFrame.generation;
    }

    // ... (getters like fullName, parentView, getView remain the same) ...
    private get fullName(): string {
        const parentName = this.props.viewMetadata.name;
        // @ts-ignore
        return (parentName ? (parentName + ".") : "") + this.props.name;
    }

    private get parentView(): ViewMetadata {
        return this.props.viewMetadata;
    }

    private getView(): ViewMetadata | undefined {
        return this.parentView.childViews.items.find(c => c.name === this.fullName);
    }

    /**
     * This method will be exposed as the renderHandler. It sets the component
     * in state, which causes the portal to render it.
     */
    private renderInPortal = (component: React.ReactElement, portalRootDiv: HTMLElement): Promise<void> => {
        const view = this.getView();
        if (!view) {
            return Promise.reject(new Error("ViewFrame not mounted or already destroyed."));
        }

        const wrappedComponent = (
            <ViewSharedContext.Provider value={view.context}>
                {component}
            </ViewSharedContext.Provider>
        );

        return new Promise<void>(resolve => {
            this.setState({ componentToRender: wrappedComponent, portalMountPoint: portalRootDiv }, resolve);
        });
    };

    public componentDidMount() {
        if (!this.placeholder) return;

        const existingView = this.getView();
        if (existingView) {
            this.replacement = existingView.placeholder;
            this.placeholder.parentElement!.replaceChild(this.replacement, this.placeholder);
            return;
        }

        const id = this.generation;
        const childView = newView(id, this.fullName, false, this.placeholder);
        childView.generation = this.generation;
        childView.parentView = this.parentView;
        childView.context = this.props.context;

        debugger
        
        // Notify the parent that the frame is ready by calling the 'loaded' prop
        const loadedHandler = this.props.loaded;
        if (loadedHandler) {
            // The handler receives the view object, which now contains our renderHandler
            childView.viewLoadTask.promise.then(() => loadedHandler());
        }

        // view portal
        // **KEY CHANGE**: Attach our render method to the metadata object
        

        const shadowRoot = this.placeholder.attachShadow({ mode: "open" }).getRootNode() as HTMLElement;
        const head = document.createElement("head");
        const body = document.createElement("body");
        const portalRootDiv = document.createElement("div");
        portalRootDiv.id = webViewRootId;

        const styleResets = document.createElement("style");
        styleResets.innerHTML = ":host { all: initial; display: block; }";
        head.appendChild(styleResets);

        // get sticky stylesheets
        const stylesheets = getStylesheets(document.head).filter(s => s.dataset.sticky === "true");
        stylesheets.forEach(s => head.appendChild(document.importNode(s, true)));

        body.appendChild(portalRootDiv);
        shadowRoot.appendChild(head);
        shadowRoot.appendChild(body);

        childView.head = head;
        childView.root = portalRootDiv;

        this.parentView.childViews.add(childView);

        childView.renderHandler = component => this.renderInPortal(component, portalRootDiv);
        // Set the mount point to enable the portal, but render no content yet.
        // this.setState({ portalMountPoint: portalRootDiv });
        onChildViewAdded(childView);
    }

    public componentWillUnmount() {
        if (this.replacement) {
            this.replacement.parentElement!.replaceChild(this.placeholder!, this.replacement);
        }

        const existingView = this.getView();
        if (existingView && this.generation === existingView.generation) {
            this.parentView.childViews.remove(existingView);
            onChildViewRemoved(existingView);
        }
    }
    
    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const existingView = this.getView();
        if (!existingView) {
            // View is not available, log error generically
            return;
        }
        // execute error handling inside promise, to avoid the error handler to rethrow exception inside componentDidCatch
        Promise.resolve(null).then(() => onChildViewErrorRaised(existingView, error));
    }

    public render() {
        const { portalMountPoint, componentToRender } = this.state;

        return (
            <div ref={e => this.placeholder = e!} className={this.props.className}>
                {/* The portal now renders the component from the state */}
                {portalMountPoint && componentToRender && ReactDOM.createPortal(componentToRender, portalMountPoint)}
            </div>
        );
    }
}

window["ViewFrame"] = {
    ViewFrame: ViewFrame,
    ViewSharedContext: ViewSharedContext
};