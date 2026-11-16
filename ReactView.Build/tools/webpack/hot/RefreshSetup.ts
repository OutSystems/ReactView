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
