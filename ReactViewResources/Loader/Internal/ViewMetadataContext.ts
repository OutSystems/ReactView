import * as React from "react";
import { ViewMetadata } from "./ViewMetadata";

const EnsureDisposeInnerViewsFlagKey = "ENSURE_DISPOSE_INNER_VIEWS";

export const ViewMetadataContext = React.createContext<ViewMetadata>(null!);

export function getEnsureDisposeInnerViewsFlag(): boolean {
    return !!window[EnsureDisposeInnerViewsFlagKey];
}

export function setEnsureDisposeInnerViewsFlag(ensureDisposeInnerViews: boolean): void {
    window[EnsureDisposeInnerViewsFlagKey] = ensureDisposeInnerViews;
}