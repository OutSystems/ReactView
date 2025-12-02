import * as React from "react";
import { IViewFrameProps } from "ViewFrame";
import { newView, ViewMetadata } from "../Internal/ViewMetadata";
import { ViewMetadataContext } from "../Internal/ViewMetadataContext";
import { ViewSharedContext } from "./ViewSharedContext";
import {ViewPortal} from "../Internal/ViewPortal";

interface IInternalViewFrameProps<T> extends IViewFrameProps<T> {
    viewMetadata: ViewMetadata;
    context?: T;
}

/**
 * Placeholder were a child view is mounted.
 * */
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

class InternalViewFrame<T> extends React.Component<IInternalViewFrameProps<T>, {}, ViewMetadata> {
    private static generation = 0;

    private readonly generation: number;
    private placeholder: Element;
    private replacement: Element;
    private shadowRoot: Element | null = null;

    constructor(props: IInternalViewFrameProps<T>, context: any) {
        super(props, context);
        if (props.name === "") {
            throw new Error("View Frame name must be specified (not empty)");
        }

        if (!/^[A-Za-z_][A-Za-z0-9_]*/.test(props.name as string)) {
            // must be a valid js symbol name
            throw new Error("View Frame name can only contain letters, numbers or _");
        }

        // keep track of this frame generation, so that we can keep tracking the most recent frame instance
        this.generation = ++InternalViewFrame.generation;

        // const view = this.getView();
        // if (view) {
        //     // update the existing view generation
        //     view.generation = this.generation;
        // }
    }

    private setPlaceholder = (element: HTMLDivElement) => {
        console.log("ViewFrame :: Setting placeholder REF");
        this.placeholder = element;
        if (this.placeholder && !this.shadowRoot) {
            console.log("ViewFrame :: Attach Shadow Root");
            // create an open shadow-dom, so that bubbled events expose the inner element
            this.shadowRoot = this.placeholder.attachShadow({ mode: "open" }).getRootNode() as Element;
            this.forceUpdate();
        }
    }

    private get fullName() {
        const parentName = this.parentView.name;
        // @ts-ignore
        return (parentName ? (parentName + ".") : "") + this.props.name;
    }

    public shouldComponentUpdate(): boolean {
        // prevent component updates
        return false;
    }

    private get parentView(): ViewMetadata {
        return this.props.viewMetadata;
    }

    private getView(): ViewMetadata | undefined {
        console.log("ViewFrame : getView ", this.fullName);
        console.log("ViewFrame : getView ", this.parentView.childViews);
        const fullName = this.fullName;
        return this.parentView.childViews.items.find(c => c.name === fullName);
    }

    public componentDidMount() {
        console.log("ViewFrame :: componentDidMount: ", this.fullName);
        debugger;
        const existingView = this.getView();
        if (existingView) {
            // there's a view already rendered, insert in current frame's placeholder
            console.log("ViewFrame :: Existing View: ", existingView);
            console.log("ViewFrame :: Existing ViewName: ", existingView.name);
            console.log("ViewFrame :: Existing ViewchildViews: ", existingView.childViews);
            console.log("ViewFrame :: Placeholder: ", this.placeholder);
            console.log("ViewFrame :: Placeholder Parent: ", this.placeholder.parentElement);
            this.replacement = existingView.placeholder;
            this.placeholder.parentElement!.replaceChild(this.replacement, this.placeholder);
            return;
        }

        console.log("ViewFrame :: componentDidMount: CreateNewView", this.fullName);
        
        const id = this.generation; // for this purpose we can use generation (we just need a unique number)
        const childView = newView(id, this.fullName, false, this.placeholder);
        childView.generation = this.generation;
        childView.parentView = this.parentView;
        childView.context = this.props.context;

        const loadedHandler = this.props.loaded;
        if (loadedHandler) {
            childView.viewLoadTask.promise.then(() => loadedHandler());
        }

        this.parentView.childViews.add(childView);
    }

    public componentWillUnmount() {
        if (this.replacement) {
            // put back the original container, otherwise react will complain
            this.replacement.parentElement!.replaceChild(this.placeholder, this.replacement);
        }

        const existingView = this.getView();
        if (existingView && this.generation === existingView.generation) {
            // this is the most recent frame - meaning it was not replaced by another one - so the view should be removed
            this.parentView.childViews.remove(existingView);
            console.log("unmount internal view frame", this.fullName);
        }

        
        this.shadowRoot = null;
    }

    public render() {
        console.log("Render ViewFrame: ", this.fullName);
        return <div ref={this.setPlaceholder} className={this.props.className}>
            {this.shadowRoot && <ViewPortal view={this.getView()!} shadowRoot={this.shadowRoot} />}
        </div>;
    }
}

window["ViewFrame"] = {
    ViewFrame: ViewFrame,
    ViewSharedContext: ViewSharedContext
};
