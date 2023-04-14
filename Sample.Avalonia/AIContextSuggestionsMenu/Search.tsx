import * as React from "react";
import { classNames } from "./StylesHelper";
import Input from "./Input";
import "./Search.scss";

export interface ISearchProperties {
    autoFocus?: boolean;
    className?: string;
    readOnly?: boolean;
    tooltip?: string;
    placeholder?: string;
    showClearInputButton?: boolean;
    hasAnimation?: boolean;
    selectTextOnFocus?: boolean;

    searchValue: string;
    searchValueChanged: (searchTerm: string) => void;

    clearInputButtonClicked?: () => void;

    isSearchExpanded: boolean;
    searchExpanded?: () => void;
    searchCollapsed?: () => void;

    onKeyDown?(event: React.KeyboardEvent<HTMLElement>): void;
    onBlur?(event: React.FocusEvent<HTMLInputElement>): void;
    onFocus?(event: React.FocusEvent<HTMLInputElement>): void;
}

interface ISearchState {
    isAnimating: boolean;
}

export default class Search extends React.Component<ISearchProperties, ISearchState> {
    private searchInputRef: React.RefObject<Input>;

    constructor(props: ISearchProperties) {
        super(props);
        this.searchInputRef = React.createRef<Input>();

        this.state = {
            isAnimating: false,
        };
    }

    public collapse(): void {
        this.collapseSearchInput();
    }

    public focus(): void {
        if (this.searchInputRef.current) {
            this.searchInputRef.current.focusInput();
        }
    }

    public expand = (): void => {
        this.props.searchExpanded && this.props.searchExpanded();
        if (this.props.hasAnimation) {
            this.setState({ isAnimating: true });
        }
    };

    private collapseSearchInput = () => {
        this.props.searchCollapsed && this.props.searchCollapsed();
        if (this.props.hasAnimation) {
            this.setState({ isAnimating: true });
        }
    };

    private onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        this.props.onKeyDown && this.props.onKeyDown(event);
    };

    private onAnimationEnd = (_event: React.AnimationEvent<HTMLDivElement>) => {
        if (this.props.isSearchExpanded) {
            this.focus();
        }
        this.setState({ isAnimating: false });
    };

    private renderExpandedSearchInput(): JSX.Element {
        const {
            className,
            readOnly,
            hasAnimation,
            isSearchExpanded,
            searchValue,
            placeholder,
            selectTextOnFocus,
            autoFocus,
            showClearInputButton,
            searchValueChanged,
            clearInputButtonClicked,
            onBlur,
        } = this.props;

        const { isAnimating } = this.state;

        const searchInputClasses = classNames({
            [className]: !!className,
            "search-input": true,
            readonly: readOnly,
            "opening-search": hasAnimation && isAnimating && isSearchExpanded,
            "closing-search": hasAnimation && isAnimating && !isSearchExpanded,
        });

        const iconClasses = classNames({
            magnifyingGlass: true,
            icon: true,
        });

        const clearButtonClasses = classNames({
            crossCircle: true,
            "clear-button": true,
        });

        return (
            <div className={searchInputClasses} onAnimationEnd={this.onAnimationEnd}>
                <div className="icon-wrapper">
                    <span className={iconClasses} />
                </div>
                <Input
                    disabled={readOnly}
                    ref={this.searchInputRef}
                    type="text"
                    value={searchValue}
                    valueChanged={searchValueChanged}
                    className="input"
                    placeholder={placeholder}
                    onBlur={onBlur}
                    selectTextOnFocus={selectTextOnFocus}
                    autoFocus={autoFocus}
                    onFocus={this.props.onFocus}
                    onKeyDown={this.onKeyDown}
                />
                <div className="clear-button-wrapper">
                    {showClearInputButton && searchValue && (
                        <span className={clearButtonClasses} onClick={clearInputButtonClicked} />
                    )}
                </div>
            </div>
        );
    }

    private renderCollapsedSearchInput(): JSX.Element {
        const { placeholder, tooltip } = this.props;

        return (
            <div
                className={`search magnifyingGlass`}
                title={tooltip || placeholder}
                onClick={this.expand}
            />
        );
    }

    public render(): JSX.Element {
        const { isSearchExpanded } = this.props;
        const { isAnimating } = this.state;

        return isSearchExpanded || isAnimating ? this.renderExpandedSearchInput() : this.renderCollapsedSearchInput();
    }
}