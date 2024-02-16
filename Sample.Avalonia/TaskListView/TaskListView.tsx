import * as React from "react";
import ViewPlugin from "./../ViewPlugin/ViewPlugin";
import {IPluginsContext, PluginsContext} from "PluginsProvider";
import "./TaskListView.scss";
import { ResourceLoader } from "ResourceLoader";

export interface ITask {
    id: number;
    text: string;
    isCompleted: boolean;
    user: string;
}

export interface ITaskListViewProperties {
    getTasks(): Promise<ITask[]>;
}

export interface ITaskListViewBehaviors {
    toggleHideCompletedTasks(): void;
    refresh(): void;
}

interface ITaskListViewState {
    tasks: ITask[];
    hideCompletedTasks: boolean;
}

interface ITaskListItemProperties {
    task: ITask;
}

class TaskListItem extends React.Component<{ task: ITask }, {}, IPluginsContext> {
    constructor(props: ITaskListItemProperties) {
        super(props);
    }

    render(): JSX.Element {
        return (
            <div className="list-item">
                <input className="check" type="checkbox" defaultChecked={this.props.task.isCompleted} />
                <div className="content">
                    <div className="text">{this.props.task.text}</div>
                    <div className="user">
                        Added by:
                        <ResourceLoader.Consumer>
                            {url => <img className="user-pic" src={url(this.props.task.user, "size=normal")} />}
                        </ResourceLoader.Consumer>
                    </div>
                </div>
            </div>
        );
    }
}

export default class TaskListView extends React.Component<ITaskListViewProperties, ITaskListViewState> implements ITaskListViewBehaviors {
    declare context: React.ContextType<typeof PluginsContext>;

    private viewPlugin: ViewPlugin;

    constructor(props: ITaskListViewProperties) {
        super(props);
        this.state = {
            tasks: [],
            hideCompletedTasks: false
        };
        
        this.refresh();
    }

    public toggleHideCompletedTasks(): void {
        this.setState(prevState => ({
            hideCompletedTasks: !prevState.hideCompletedTasks
        }));
    }

    public async refresh(): Promise<void> {
        const tasks = await this.props.getTasks();
        this.setState({ tasks });
    }

    public async componentDidMount(): Promise<void> {
        this.viewPlugin = this.context.getPluginInstance<ViewPlugin>(ViewPlugin);
        this.viewPlugin.notifyViewLoaded("Task List View");
    }

    private renderItems(): JSX.Element {
        return (
            <>
                {this.state.tasks.filter(t => !this.state.hideCompletedTasks || !t.isCompleted).map(t => <TaskListItem key={t.id} task={t}/>)}
            </>
        );
    }

    public render(): JSX.Element {
        return (
            <div className="wrapper">
                {this.renderItems()}
            </div>
        );
    }
}
