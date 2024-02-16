import * as React from "react";
import { ViewFrame } from "ViewFrame";
import ViewPlugin from "./../ViewPlugin/ViewPlugin";
import {IPluginsContext, PluginsContext} from "PluginsProvider";
import "./MainView.scss"; // import a stylesheet
import TaskListView from "./../TaskListView/TaskListView"; // import another component
import * as BackgroundImage from "./Tasks.png"; // import images

export interface ITaskCreationDetails {
    text: string;
}

export enum BackgroundKind {
    None,
    Color,
    Image
}

// component properties ... the interface name must start with I prefix and end with Properties suffix
export interface IMainViewProperties {
    getTasksCount(): Promise<number>;
    taskListShown(): void;
    inputChanged(): void;
    addTaskButtonClicked(taskDetails: ITaskCreationDetails): void;
    readonly titleMessage: string;
    readonly backgroundKind: BackgroundKind;
}

// component methods that can be called on .NET  ... the interface name must start with I prefix and end with Behaviors suffix
export interface IMainViewBehaviors {
    refresh(): void;
}

export interface IChildViews {
    ListView: TaskListView;
}

enum TaskListShowStatus {
    Show,
    ShowWrapped,
    Hide
}

interface MainViewState {
    tasksCount: number;
    taskListShowStatus: TaskListShowStatus;
}

export default class MainView extends React.Component<IMainViewProperties, MainViewState> implements IMainViewBehaviors {
    declare context: React.ContextType<typeof PluginsContext>;
    
    private viewPlugin: ViewPlugin;
    private readonly inputRef = React.createRef<HTMLInputElement>();

    constructor(props: IMainViewProperties) {
        super(props, );
        this.initialize();
    }

    private async initialize(): Promise<void> {
        this.state = {
            tasksCount: 0,
            taskListShowStatus: TaskListShowStatus.Show
        };
        this.refresh();
    }

    public refresh(): void {
        (async () => {
            const tasksCount = await this.props.getTasksCount();
            this.setState({ tasksCount });
        })();
    }

    public componentDidMount(): void {
        this.viewPlugin = this.context.getPluginInstance<ViewPlugin>(ViewPlugin);
        this.viewPlugin.notifyViewLoaded("Main View");
        
        if (this.props.backgroundKind === BackgroundKind.Image) {
            // example on how to use an image resource in codee
            document.body.style.backgroundImage = `url(${BackgroundImage})`;
        }
    }

    private toggleShowTasks = () => {
        const next = (this.state.taskListShowStatus + 1) % 3;
        if (next === TaskListShowStatus.Show) {
            this.props.taskListShown();
        }
        this.setState({ taskListShowStatus: next });
    }

    private onAddTaskButtonClicked = () => {
        const input = this.inputRef.current;
        this.props.addTaskButtonClicked({ text: input.value });
        input.value = "";
    };

    private renderViewFrame() {
        // example on how to render a child view
        return <ViewFrame<IChildViews> key="list_frame" name="ListView" className="" />;
    }

    private renderListView() {
        // this is showing the capability of child views from moving around in DOM without losing state
        // state will only losed when unmounted
        switch (this.state.taskListShowStatus) {
            case TaskListShowStatus.Show:
                return this.renderViewFrame();
            case TaskListShowStatus.ShowWrapped:
                return <div className="blocked-list">{this.renderViewFrame()}</div>;
            default:
                return null;
        }
    }

    public render(): JSX.Element {
        return (
            <div className="wrapper">
                <div className="title">{this.props.titleMessage}</div>
                <input className="task-input" ref={this.inputRef} onChange={() => this.props.inputChanged()} />
                <button className="task-add" onClick={this.onAddTaskButtonClicked}>Add Task</button>
                <button className="tasks-toggle-show" onClick={this.toggleShowTasks}>Show/Block/Hide Tasks</button>
                {this.renderListView()}
                <div>{this.state.tasksCount} task(s)</div>
            </div>
        );
    }
}