import * as React from "react";
import { ViewFrame } from "ViewFrame";
import { TrackId, ITrackable } from "Trackable";
import ViewPlugin from "./ViewPlugin";
import { IPluginsContext } from "PluginsProvider";
import "./ExampleView.scss";
import * as Image from "./beach.jpg";
import { ResourceLoader } from "ResourceLoader";

export interface ISomeType {
    name: string;
}

export enum ImageKind {
    None,
    Beach
}

export interface MenuItem extends ITrackable {
    trackId: TrackId;
    label: string;
}

export interface IExampleViewProperties {
    click(arg: MenuItem): void;
    getMenuItems(): Promise<MenuItem[]>;
    getTime(): Promise<string>;
    viewMounted(): void;
    readonly constantMessage: string;
    readonly image: ImageKind;
}

export interface IExampleViewBehaviors {
    callMe(): void;
}

enum SubViewShowStatus {
    Show,
    ShowWrapped,
    Hide
}

export default class ExampleView extends React.Component<IExampleViewProperties, { time: string; subViewShowStatus: SubViewShowStatus, menuItems: MenuItem[] }> implements IExampleViewBehaviors {

    private viewplugin: ViewPlugin;

    constructor(props: IExampleViewProperties, context: IPluginsContext) {
        super(props, context);
        this.initialize();
        this.viewplugin = context.getPluginInstance<ViewPlugin>(ViewPlugin);
    }

    private async initialize(): Promise<void> {
        this.state = {
            time: "-",
            subViewShowStatus: SubViewShowStatus.Show,
            menuItems: []
        };
        let items = await this.props.getMenuItems();
        let time = await this.props.getTime();
        this.setState({ time: time, menuItems: items });
    }

    public callMe(): void {
        alert("React View says: clicked on a WPF button");
    }

    public componentDidMount(): void {
        this.viewplugin.notifyViewLoaded("ExampleView");
        if (this.state.subViewShowStatus !== SubViewShowStatus.Hide) {
            this.props.viewMounted();
        }
    }

    private onMountSubViewClick = () => {
        let next = (this.state.subViewShowStatus + 1) % 3;
        if (next === SubViewShowStatus.Show) {
            this.props.viewMounted();
        }
        this.setState({ subViewShowStatus: next });
    }

    private renderViewFrame() {
        return <ViewFrame key="test" name="test" className="" />;
    }

    private renderSubView() {
        switch (this.state.subViewShowStatus) {
            case SubViewShowStatus.Show:
                return <div>{this.renderViewFrame()}</div>;
            case SubViewShowStatus.ShowWrapped:
                return this.renderViewFrame();
            default:
                return null;
        }
    }

    public render(): JSX.Element {
        return (
            <div className="wrapper">
                {this.props.constantMessage}
                <br />
                Current time: {this.state.time}<br />
                <br />
                {this.props.image === ImageKind.Beach ? <img className="image" src={Image} /> : null}
                <br />
                <div className="buttons-bar">
                    {this.state.menuItems.map(mi => (<button onClick={() => this.props.click(mi)}>{mi.label}</button>))}
                    <button onClick={this.onMountSubViewClick}>Mount/Wrap/Hide child view</button>
                </div>
                Custom resource:
                <ResourceLoader.Consumer>
                    {url => <img src={url("Ok.png")} />}
                </ResourceLoader.Consumer>
                <br />
                {this.renderSubView()}
            </div>
        );
    }
}