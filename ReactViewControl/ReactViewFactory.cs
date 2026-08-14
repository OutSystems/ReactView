using System;
using WebViewControl;

namespace ReactViewControl {

    public class ReactViewFactory {

        /// <summary>
        /// The default stylesheet.
        /// </summary>
        public virtual ResourceUrl DefaultStyleSheet => null;

        /// <summary>
        /// Place plugins initialization here and return the plugins modules instances.
        /// </summary>
        /// <returns></returns>
        public virtual IViewModule[] InitializePlugins() => new IViewModule[0];

        /// <summary>
        /// Shows developers tools when the control is instantiated.
        /// </summary>
        public virtual bool ShowDeveloperTools => false;

        /// <summary>
        /// Developer tools become available pressing F12.
        /// </summary>
        public virtual bool EnableDebugMode => false;

        /// <summary>
        /// The view is cached and preloaded. First render occurs earlier.
        /// </summary>
        public virtual bool EnableViewPreload => true;

        public virtual bool EnsureInnerViewsAreDisposed => true;

        /// <summary>
        /// Each script is loaded once per document, instead of once per view. Inner views are shadow roots,
        /// and shadow dom does not encapsulate scripts, so a script appended for one view has already
        /// executed for every other one. Set to false to restore the previous per view behaviour.
        /// </summary>
        public virtual bool LoadScriptsOncePerDocument => true;

        /// <summary>
        /// The plugins of a view are disposed when that view is destroyed. Plugins are not part of the react
        /// tree, so unmounting does not reach them, and one that registered itself in document level state
        /// keeps its view's root, and the whole dom under it, alive. Set to false to restore the previous
        /// behaviour, where only the host released them.
        /// </summary>
        public virtual bool EnsureViewPluginsAreDisposed => true;

        /// <summary>
        /// Calls through the view properties proxy to methods that return nothing are dropped, and logged to
        /// the console, when the view was destroyed or its native object is no longer bound (typical remount
        /// / teardown races). Calls to methods that return a value are left alone, and still surface as
        /// errors: their result is used by the caller, and resolving it with undefined would only move the
        /// failure away from its cause. Set to false to restore the previous behaviour, where every one of
        /// those calls surfaces as an uncaught error.
        /// </summary>
        public virtual bool BailOutOnUnboundNativeObjectCalls => true;
    }
}
