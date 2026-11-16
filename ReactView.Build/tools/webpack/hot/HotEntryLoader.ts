import { parse } from "path";

/*
 * Webpack loader applied (post) to the view entry modules of the dev server build.
 *
 * react-refresh updates function components in place. Everything else - class components, modules that also
 * export enums or helpers - is not a refresh boundary, so webpack bubbles such updates up to the entry. The entry
 * accepts them here: webpack re-executes it (and the updated modules below it) and the fresh exports are handed to
 * the ReactView loader, which re-renders the views showing that component. The view remounts with its native
 * bindings intact, which is what Fast Refresh promises for class components anyway.
 * */
function hotEntryLoader(this: { resourcePath: string }, source: string): string {
    const entryName: string = parse(this.resourcePath).name;
    return source + `
;if (module.hot) {
    module.hot.accept();
    if (window.__reactview_hot__) {
        window.__reactview_hot__.moduleUpdated(${JSON.stringify(entryName)}, module.exports);
    }
}
`;
}

module.exports = hotEntryLoader;
