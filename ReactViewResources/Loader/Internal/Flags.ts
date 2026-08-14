// flags set by the host on the main view load, kept here rather than in ViewMetadataContext because that
// module depends on react, and bootstrap reads flags before react has been defined
const LoadScriptsOncePerDocumentFlagKey = "LOAD_SCRIPTS_ONCE_PER_DOCUMENT";
const EnsureViewPluginsAreDisposedFlagKey = "ENSURE_VIEW_PLUGINS_ARE_DISPOSED";
const BailOutOnUnboundNativeObjectCallsFlagKey = "BAIL_OUT_ON_UNBOUND_NATIVE_OBJECT_CALLS";

export function getLoadScriptsOncePerDocumentFlag(): boolean {
    return !!window[LoadScriptsOncePerDocumentFlagKey];
}

export function setLoadScriptsOncePerDocumentFlag(loadScriptsOncePerDocument: boolean): void {
    window[LoadScriptsOncePerDocumentFlagKey] = loadScriptsOncePerDocument;
}

export function getEnsureViewPluginsAreDisposedFlag(): boolean {
    return !!window[EnsureViewPluginsAreDisposedFlagKey];
}

export function setEnsureViewPluginsAreDisposedFlag(ensureViewPluginsAreDisposed: boolean): void {
    window[EnsureViewPluginsAreDisposedFlagKey] = ensureViewPluginsAreDisposed;
}

export function getBailOutOnUnboundNativeObjectCallsFlag(): boolean {
    return !!window[BailOutOnUnboundNativeObjectCallsFlagKey];
}

export function setBailOutOnUnboundNativeObjectCallsFlag(bailOutOnUnboundNativeObjectCalls: boolean): void {
    window[BailOutOnUnboundNativeObjectCallsFlagKey] = bailOutOnUnboundNativeObjectCalls;
}
