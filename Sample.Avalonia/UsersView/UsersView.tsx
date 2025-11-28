import * as React from "react";
import { IPluginsContext } from "PluginsProvider";
import "./UsersView.scss";

export interface IUsersViewProperties {
}

export interface IUsersViewBehaviors {
    
}

export default class UsersView extends React.Component<IUsersViewProperties, {}> implements IUsersViewBehaviors {
    
    constructor(props: IUsersViewProperties, context: IPluginsContext) {
        super(props, context);
    }
    
    public render(): JSX.Element {
        return (
            <div className="users-wrapper">
                Hello World!! This is the users inner view!
            </div>
        );
    }
}
