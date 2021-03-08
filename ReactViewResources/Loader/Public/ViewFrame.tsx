import * as React from "react";
import { IViewFrameProps } from "ViewFrame";
import { newView, ViewMetadata } from "../Internal/ViewMetadata";
import { ViewMetadataContext } from "../Internal/ViewMetadataContext";
import { ViewSharedContext } from "./ViewSharedContext";

interface IInternalViewFrameProps<T> extends IViewFrameProps<T> {
    viewMetadata: ViewMetadata;
    context: any;
}

/**
 * Placeholder were a child view is mounted.
 * */
export class ViewFrame<T> extends React.Component<IViewFrameProps<T>, {}, ViewMetadata> {

    constructor(props: IViewFrameProps<T>, context: any) {
        super(props, context);
    }

    public render(): JSX.Element {
        return (
            <ViewMetadataContext.Consumer>
                {viewMetadata =>
                    <ViewSharedContext.Consumer>
                        {viewcontext => <InternalViewFrame viewMetadata={viewMetadata} context={viewcontext} {...this.props} />}
                    </ViewSharedContext.Consumer>
                }
            </ViewMetadataContext.Consumer>
        );
    }
}

class InternalViewFrame<T> extends React.Component<IInternalViewFrameProps<T>, {}, ViewMetadata> {

    private static generation = 0;

    private generation: number;
    private placeholder: Element;
    private replacement: Element;

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

        const view = this.getView();
        if (view) {
            // update the existing view generation
            view.generation = this.generation;
        }
    }

    private get fullName() {
        const parentName = this.parentView.name;
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
        const fullName = this.fullName;
        return this.parentView.childViews.items.find(c => c.name === fullName);
    }

    public componentDidMount() {
        const existingView = this.getView();
        if (existingView) {
            // there's a view already rendered, insert in current frame's placeholder
            this.replacement = existingView.placeholder;
            this.placeholder.parentElement!.replaceChild(this.replacement, this.placeholder);
            return;
        }

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
        }
    }

    public render() {
        return <div ref={e => this.placeholder = e!} className={this.props.className} />;
    }
}

window["ViewFrame"] = {
    ViewFrame: ViewFrame,
    ViewSharedContext: ViewSharedContext
};
