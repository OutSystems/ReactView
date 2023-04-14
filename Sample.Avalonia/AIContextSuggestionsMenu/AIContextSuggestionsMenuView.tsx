import * as React from "react";
import Search from "./Search";

import MenuItem from "./AIContextSuggestionsMenuItem";
import * as TextResources from "./TextResources";
import "./AIContextSuggestionsMenu.scss";

import * as KeyCodes from "./KeyCodes";


// Telemetry
export const SuggestionsAreaTelemetryLabel = "AIContextSuggestionsMenu";

export interface IMenuEntriesList {
    entries: IMenuEntry[];
}

export interface IMenuEntry {
    actionKey: string;
    label: string;
    tooltip: string;
    icon: string;
    kind: string;
    isHighlighted: boolean;
}

export interface IAIContextSuggestionsMenuProperties {
    getMenuEntries(): Promise<IMenuEntriesList>;
    getQuickSearchMenuEntries(searchTerm: string): Promise<IMenuEntriesList>;
    menuEntryClicked(itemKey: string): void;
}

interface IAIContextSuggestionsMenuState {
    entries: IMenuEntry[];
    selectedItem: number;
    isQuickSearchExpanded: boolean;
    currentQuickSearchInputValue: string;
}

/**
 * Takes a suggestion key and strips the non-fixed part so it can be referenced by the tutorial.
 * @param {string} actionKey the suggestion key
 * @returns {string} the suggestion key in the tutorial format
 */
function getTutorialKey(actionKey: string): string {
    const tutorialKeyStartIdx = actionKey.indexOf("|");
    return tutorialKeyStartIdx !== -1 ? actionKey.substr(tutorialKeyStartIdx + 1) : actionKey; // remove the "GUID|"
}

export default class AIContextSuggestionsMenuView extends React.Component<IAIContextSuggestionsMenuProperties, IAIContextSuggestionsMenuState> {
    private menuElementsReferences: Map<string, HTMLLIElement>;
    private rootRef: React.RefObject<HTMLElement>;

    constructor(props: IAIContextSuggestionsMenuProperties) {
        super(props);
        this.rootRef = React.createRef<HTMLElement>();
        this.updateItems();
        this.menuElementsReferences = new Map<string, HTMLLIElement>();
    }

    private setMenuElementReference = (key: string, element: HTMLLIElement): void => {
        this.menuElementsReferences.set(key, element);
    };

    private getMenuElementReference = (key: string): HTMLLIElement | null | undefined => {
        // suggestion keys start with a GUID followed by a set of tokens with every part seperated by '|'
        // so the 'key' coming from the tutorial may also have several tokens seperated by '|' and we'll try
        // to match that to the suggestion's key (without the GUID part)
        const tutorialElemKeyStartIdx = key.indexOf("|");
        if (tutorialElemKeyStartIdx !== -1) {
            const tutorialElemKey = key.substr(tutorialElemKeyStartIdx + 1); // remove the "<TutorialKey>|"
            return this.menuElementsReferences.get(tutorialElemKey);
        }

        return null;
    };

    public componentDidUpdate(): void {
        // focus the list (only if Quick Search is not expanded, to not steal its focus)
        !this.state.isQuickSearchExpanded && this.rootRef.current?.focus();
    }

    private async updateItems(): Promise<void> {
        const menuEntries = await this.props.getMenuEntries();
        this.setState({
            entries: menuEntries.entries,
            selectedItem: -1,
        });
    }

    private handleKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
        switch (event.keyCode) {
            case KeyCodes.Enter:
                event.preventDefault();
                this.confirmSelection();
                break;
            case KeyCodes.ArrowUp:
                event.preventDefault();
                this.navigateUp();
                break;
            case KeyCodes.ArrowDown:
                event.preventDefault();
                this.navigateDown();
                break;
            case KeyCodes.TAB:
                event.preventDefault();
 
                this.navigateDown();

                break;
            default:
                if (!this.state.isQuickSearchExpanded) {
                    this.handleQuickSearchTrigger(event);
                }
        }
    }

    private confirmSelection(): void {
        if (!this.state.entries) {
            return;
        }

        if (this.state.selectedItem !== -1) {
            this.props.menuEntryClicked(this.state.entries[this.state.selectedItem].actionKey);
        } else {
            // if the user didn't select a specific item but we have at least one highlighted item
            // we allow the automatic selection of the first
            const firstHighlight = this.state.entries.findIndex(e => e.isHighlighted);
            if (firstHighlight !== -1) {
                this.props.menuEntryClicked(this.state.entries[firstHighlight].actionKey);
            }
        }
    }

    private navigateUp(): void {
        if (!this.state.entries) {
            return;
        }

        this.setState(prevState => {
            let newSelection = prevState.selectedItem - 1;
            if (newSelection < 0) {
                newSelection = prevState.entries.length - 1;
            }
            return {
                selectedItem: newSelection,
            };
        });
    }

    private navigateDown(): void {
        if (!this.state.entries) {
            return;
        }

        this.setState(prevState => {
            let newSelection = prevState.selectedItem + 1;
            if (newSelection > prevState.entries.length - 1) {
                newSelection = 0;
            }
            return {
                selectedItem: newSelection,
            };
        });
    }

    private handleQuickSearchTrigger(event: React.KeyboardEvent<HTMLElement>): void {
        // MacOS has slightly different behaviors and values for eventKeyCode,
        // leading to differences in capitalization. Normalization is followed in onQuickSearchInputChanged
        const inputString = String.fromCharCode(event.keyCode);

        // Only accept alphanumeric characters here. Blindly injecting whatever String.fromCharCode
        // returns directly into the search input would not be a good idea.
        if (/[a-z0-9]/i.test(inputString)) {
            event.preventDefault();
            this.onQuickSearchExpanded();

            // Only propagate text if there's no modifier (except SHIFT, which might apply)
                this.onQuickSearchInputChanged(inputString);

        }
    }

    private onQuickSearchExpanded = (): void => {
        this.setState({
            isQuickSearchExpanded: true,
        });
    };

    private capitalizeFirstLetter(str: string): string {
        const firstLetter = str.charAt(0);
        return firstLetter === firstLetter.toLowerCase() ? firstLetter.toUpperCase() + str.slice(1) : str;
    }

    private onQuickSearchInputChanged = (newValue: string): void => {
        // Capitalize the first letter of the input to match the
        // behavior of the handleQuickSearchTriggerModes
        newValue = this.capitalizeFirstLetter(newValue);

        this.setState({ currentQuickSearchInputValue: newValue }, () => {
            if (!newValue) {
                // When the input is cleared, we want to immediately show the "non-quick-search"
                // suggestions again, and thus we don't want to debounce the event in this case.
                this.onQuickSearchInputCleared();
            } else {
                    // Because we're debouncing this event, this currentQuickSearchInputValue
                    // check becomes crucial to provide a good UX when we type something and
                    // then clear the search input super quickly. Without the check, we'd be
                    // "behind in time" in those scenarios, which would lead to a funky UX.
                    if (this.state.currentQuickSearchInputValue) {
                        this.refreshQuickSearchEntries(newValue);
                    }
            }
        });
    };

    private refreshQuickSearchEntries = async (searchTerm: string): Promise<void> => {
        const quickSearchEntries = await this.props.getQuickSearchMenuEntries(searchTerm);
        this.setState({
            entries: quickSearchEntries.entries,
        });
    };

    private onQuickSearchInputCleared = (): void => {
        this.updateItems();
    };

    private renderHeaderIconAndTitle(): JSX.Element {
        return (
            <div className="icon-and-title-container">
                <img className="icon" />
                <div className={`bold inline-suggestions-title`}>{TextResources.Title}</div>
            </div>
        );
    }

    private renderHeaderQuickSearch(): JSX.Element {
        const { isQuickSearchExpanded, currentQuickSearchInputValue } = this.state;

        return (
            <Search
                className="search-bar"
                placeholder={TextResources.Placeholder}
                tooltip={TextResources.TooltipForSearchTrigger}
                autoFocus={true}
                //hasAnimation={true}
                showClearInputButton={true}
                isSearchExpanded={isQuickSearchExpanded}
                searchExpanded={this.onQuickSearchExpanded}
                searchValue={currentQuickSearchInputValue}
                searchValueChanged={this.onQuickSearchInputChanged}
                clearInputButtonClicked={() => this.onQuickSearchInputChanged("")}
            />
        );
    }

    private renderHeader(): JSX.Element {
        const { isQuickSearchExpanded } = this.state;

        const headerClassNames = isQuickSearchExpanded ? "header-quick-search-expanded" : "header-quick-search-collapsed";

        return (
            <div className={"header " + headerClassNames}>
                {!isQuickSearchExpanded && this.renderHeaderIconAndTitle()}
                {this.renderHeaderQuickSearch()}
            </div>
        );
    }

    private renderNoService(): JSX.Element {
        return (
            <div className={`no-suggestions-message`}>
                <span className={`no-suggestions-icon`} />
                <span className="no-suggestions-text">{TextResources.NoServiceMessage}</span>
            </div>
        );
    }

    private renderNoEntries(): JSX.Element {
        return (
            <div className={`no-suggestions-message`}>
                <img className="icon"  />
                <span className="no-suggestions-text">{TextResources.NoSuggestionsMessage}</span>
            </div>
        );
    }

    private renderNoQuickSearchEntries(): JSX.Element {
        return <div className="no-quick-search-suggestions-message">{TextResources.NoQuickSearchSuggestionsMessage}</div>;
    }

    private renderElements(): JSX.Element {
        const { entries, selectedItem } = this.state;
        const { menuEntryClicked } = this.props;

        return (
            <ul>
                {entries.map((e, i) => {
                    // key for the tutorial
                    const tutorialKey = getTutorialKey(e.actionKey);
                    return (
                        <MenuItem
                            key={e.actionKey}
                            label={e.label}
                            tooltip={e.tooltip}
                            icon={e.icon}
                            isHighlighted={e.isHighlighted}
                            isSelected={selectedItem === i}
                            triggerAction={() => menuEntryClicked(e.actionKey)}
                            setElementReference={(elem: HTMLLIElement) => this.setMenuElementReference(tutorialKey, elem)}
                        />
                    );
                })}
            </ul>
        );
    }

    private renderContent(): JSX.Element {
        const { entries, isQuickSearchExpanded, currentQuickSearchInputValue } = this.state;
        const shouldRenderQuickSearchContent = isQuickSearchExpanded && currentQuickSearchInputValue;

        if (entries === null) {
            return shouldRenderQuickSearchContent ? this.renderNoQuickSearchEntries() : this.renderNoService();
        } else if (entries.length === 0) {
            return shouldRenderQuickSearchContent ? this.renderNoQuickSearchEntries() : this.renderNoEntries();
        } else {
            return this.renderElements();
        }
    }

    public render(): JSX.Element | null {
        // The state is deliberately *not* initialized in the constructor; this prevents weird flicks.
        // Keep in mind that this means that all fields of the state start out as undefined.
        if (this.state === null) {
            return null;
        }

        return (
            <nav className="context-menu" tabIndex={-1} ref={this.rootRef} data-telemetry-area={SuggestionsAreaTelemetryLabel} onKeyDown={e => this.handleKeyDown(e)}>
                {this.renderHeader()}
                {this.renderContent()}
            </nav>
        );
    }
}
