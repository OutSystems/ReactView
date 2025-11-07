import * as React from "react";

export interface IUIEditorProperties {
    
}

export default class UIEditorLike extends React.Component<IUIEditorProperties, { }> {
    constructor(props: IUIEditorProperties) {
        super(props);
    }
    
    public render(): JSX.Element {
        return (
            <div className="ui-editor-wrapper">
                
            </div>
        );
    }
}