import * as React from "react";

export interface IInputProperties {
    id?: string;
    type?: React.InputHTMLAttributes<string>["type"];
    name?: string;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    tabIndex?: number;
    autoFocus?: boolean;
    valueChanged(value: string): void;
    onBlur?(event: React.FocusEvent<HTMLInputElement>): void;
    onFocus?(event: React.FocusEvent<HTMLInputElement>): void;
    onKeyDown?(e: React.KeyboardEvent<HTMLInputElement>): void;
    selectTextOnFocus?: boolean;
    spellCheckingEnabled?: boolean;
}

export interface IInputBehaviors {
    focusInput(): void;
}

export default class Input extends React.PureComponent<IInputProperties> implements IInputBehaviors {
    public inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IInputProperties) {
        super(props);
        this.inputRef = React.createRef<HTMLInputElement>();
    }

    private onValueChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.props.valueChanged(event.target.value);
    };

    public focusInput(): void {
        if (this.inputRef.current) {
            this.inputRef.current.focus();
        }
    }

    public select(): void {
        if (this.inputRef.current) {
            this.inputRef.current.select();
        }
    }

    private handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        if (this.props.selectTextOnFocus) {
            event.target.select();
        }

        if (this.props.onFocus) {
            this.props.onFocus(event);
        }
    };

    public render(): JSX.Element {
        const spellCheckingEnabled = this.props.spellCheckingEnabled || false;

        return (
            <input
                ref={this.inputRef}
                id={this.props.id}
                className={this.props.className}
                name={this.props.name}
                type={this.props.type || "text"}
                value={this.props.value}
                onChange={this.onValueChanged}
                onBlur={this.props.onBlur}
                placeholder={this.props.placeholder}
                disabled={this.props.disabled}
                readOnly={this.props.readOnly}
                tabIndex={this.props.tabIndex}
                onFocus={this.handleFocus}
                autoFocus={this.props.autoFocus}
                onKeyDown={this.props.onKeyDown}
                spellCheck={spellCheckingEnabled}
                autoCorrect={spellCheckingEnabled ? "on" : "off"}
            />
        );
    }
}