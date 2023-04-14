import * as React from "react";

import "./AIContextSuggestionsMenu.scss";

// Telemetry
export const ClickTelemetryLabel = "Suggestion Selected";

export interface IMenuEntryProps {
    label: string;
    tooltip: string;
    icon: string;
    isHighlighted: boolean;
    isSelected: boolean;
    triggerAction: () => void;
    setElementReference: (elem: HTMLLIElement) => void;
}

export default (props: IMenuEntryProps): JSX.Element => {
    const telemetryLabel = `'${props.label}' ${ClickTelemetryLabel}`;

    return (
        <li ref={e => e && props.setElementReference(e)} title={props.tooltip} onClick={() => props.triggerAction()} data-telemetry-label={telemetryLabel}>
            <img className="icon"  />
            <span className="label">{props.label}</span>
        </li>
    );
};
