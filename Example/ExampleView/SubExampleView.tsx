import * as React from "react";
import ViewPlugin from "./ViewPlugin";
import { IPluginsContext, PluginsContext } from "PluginsProvider";
import "./SubExampleView.scss";
import { ResourceLoader } from "ResourceLoader";
import { TrackId, ITrackable } from "Trackable";

export interface ISubExampleViewProperties {
    click(): void;
    getMenuItems(): Promise<SubMenuItem[]>;
    getTime(): Promise<string>;
    readonly constantMessage: string;
}

export interface ISubExampleViewBehaviors {
    callMe(): void;
}

export interface SubMenuItem extends ITrackable {
    trackId: TrackId;
    label: string;
}

class SubExampleComponent extends React.Component<{}, {}, IPluginsContext> {
    
    public static contextType = PluginsContext;

    constructor(props: {}, context: IPluginsContext) {
        super(props, context);
    }

    render(): JSX.Element {
        return <div>Plugins provider available: {(this.context as IPluginsContext).getPluginInstance ? "yes" : "no"}</div>;
    }
}

export default class SubExampleView extends React.Component<ISubExampleViewProperties, { time: string; dotNetCallCount: number, buttonClicksCount: number, menuItems: SubMenuItem[] }> implements ISubExampleViewBehaviors {

    private viewplugin: ViewPlugin;

    constructor(props: ISubExampleViewProperties, context: IPluginsContext) {
        super(props, context);
        this.initialize();
        this.viewplugin = context.getPluginInstance<ViewPlugin>(ViewPlugin);
    }

    private async initialize(): Promise<void> {
        this.state = {
            time: "-",
            dotNetCallCount: 0,
            buttonClicksCount: 0,
            menuItems: []
        };
        let items = await this.props.getMenuItems();
        let time = await this.props.getTime();
        this.setState({ time: time, menuItems: items });
    }

    public callMe(): void {
        this.setState(s => {
            return {
                dotNetCallCount: s.dotNetCallCount + 1
            };
        });
    }

    public componentDidMount(): void {
        this.viewplugin.notifyViewLoaded("SubExampleView");
    }

    public render(): JSX.Element {
        return (
            <div className="wrapper">
                {this.props.constantMessage}
                <br />
                Current time (+1hr): {this.state.time}<br />
                <br />
                Dot net calls count: {this.state.dotNetCallCount}
                <br />
                Button clicks count: {this.state.buttonClicksCount}
                <br />
                <SubExampleComponent />
                <br />
                Custom resource:
                <ResourceLoader.Consumer>
                    {url => <img src={url("Completed.png", "size=normal")} />}
                </ResourceLoader.Consumer>
                <br />
                {this.state.menuItems.map(mi => (<button onClick={() => this.setState(s => { return { buttonClicksCount: s.buttonClicksCount + 1 }; })}>{mi.label}</button>))}
            </div>
        );
    }
}