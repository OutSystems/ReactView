/*
 * Entry of the dev server build that the ReactView loader runs before React itself, in dev mode.
 *
 * react-refresh must hook the React DevTools global hook before react-dom loads, otherwise react-dom never
 * registers its renderer with it and no component can be refreshed. The loader therefore loads this entry (and
 * the webpack runtime it shares with the views) first, then the development build of React, then the views.
 * */
declare const window: any;


const RefreshRuntime = require("react-refresh/runtime");

RefreshRuntime.injectIntoGlobalHook(window);
// for tooling: lets a debugger or an agent inspect and trigger refreshes (performReactRefresh, hasUnrecoverableErrors)
window.__REACTVIEW_REFRESH_RUNTIME__ = RefreshRuntime;
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type: any) => type;

// an update webpack cannot apply in place (hot: "only" never reloads the page) leaves the module system stuck until
// the page is loaded again: ask the host for that, the views come back from the current sources
if ((module as any).hot) {
    (module as any).hot.addStatusHandler((status: string) => {
        if ((status === "abort" || status === "fail") && window.__reactview_hot__) {
            window.console.warn("[ReactView] Hot update could not be applied, reloading the view");
            window.__reactview_hot__.reload();
        }
    });
}
