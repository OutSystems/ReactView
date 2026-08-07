// flags set by the host on the main view load, kept here rather than in ViewMetadataContext because that
// module depends on react, and bootstrap reads flags before react has been defined
const LoadScriptsOncePerDocumentFlagKey = "LOAD_SCRIPTS_ONCE_PER_DOCUMENT";

export function getLoadScriptsOncePerDocumentFlag(): boolean {
    return !!window[LoadScriptsOncePerDocumentFlagKey];
}

export function setLoadScriptsOncePerDocumentFlag(loadScriptsOncePerDocument: boolean): void {
    window[LoadScriptsOncePerDocumentFlagKey] = loadScriptsOncePerDocument;
}
