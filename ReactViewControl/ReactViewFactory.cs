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
        /// Calls through the view properties proxy into a view that was already destroyed are dropped, and
        /// logged to the console, whatever they return: destroying a view unregisters its native objects, so
        /// there is nothing left to call into and nobody left to receive a result.
        /// Every other call is left alone and still surfaces as an error, including one whose native object
        /// was unregistered while its view is still live: that is a broken channel to the presenter, and
        /// dropping it would silently discard a real user interaction.
        /// Set to false to restore the previous behaviour, where a call into a destroyed view surfaces as an
        /// uncaught error as well.
        /// </summary>
        public virtual bool BailOutOnUnboundNativeObjectCalls => true;
    }
}
