import * as React from "react";

export interface IPopupViewProperties {
    loaded(): void;
}

export default class PopupView extends React.Component<IPopupViewProperties> {

    private ref = React.createRef<HTMLInputElement>();

    public componentDidMount(): void {
        window.addEventListener("keydown", () => {
            this.ref.current.value += "keydown ";
        });
        this.props.loaded();
    }

    public render(): JSX.Element {
        return (<input ref={this.ref} style={{ width: "100px", height: "100px"}} autoFocus/>);
    }
}