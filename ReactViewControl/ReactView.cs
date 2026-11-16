using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using WebViewControl;

namespace ReactViewControl {

    public delegate void ResourceRequestedEventHandler(ResourceHandler resourceHandler);

    public delegate Resource CustomResourceRequestedEventHandler(string resourceKey, params string[] options);

    public abstract partial class ReactView : IDisposable {

        private static Dictionary<Type, ReactViewRender> CachedViews { get; } = new Dictionary<Type, ReactViewRender>();

        private ReactViewRender View { get; }

        private static ReactViewRender CreateReactViewInstance(ReactViewFactory factory) {
            KeepHotReloadAgentOutOfBrowserProcesses();

            ReactViewRender InnerCreateView() {
                if (factory.RemoteDebuggingPort > 0) {
                    // read by the webview at initialization (chromium's --remote-debugging-port)
                    if (!ExtendedWebView.Settings.CommandLineSwitches.Any(s => s.Key == "remote-debugging-port")) {
                        ExtendedWebView.Settings.AddCommandLineSwitch("remote-debugging-port", factory.RemoteDebuggingPort.ToString());
                    }
                }
                var devServerUri = factory.DevServerUri;
                var view = new ReactViewRender(factory.DefaultStyleSheet, () => factory.InitializePlugins(), factory.EnableViewPreload, factory.EnableDebugMode, factory.LoadScriptsOncePerDocument, factory.EnsureViewPluginsAreDisposed, devServerUri);
                if (factory.ShowDeveloperTools) {
                    view.ShowDeveloperTools();
                }
                return view;
            }

            if (factory.EnableViewPreload) {
                var factoryType = factory.GetType();
                // check if we have a view cached for the current factory
                if (CachedViews.TryGetValue(factoryType, out var cachedView)) {
                    CachedViews.Remove(factoryType);
                }

                // create a new view in the background and put it in the cache
                AsyncExecuteInUI(() => {
                    if (!CachedViews.ContainsKey(factoryType)) {
                        CachedViews.Add(factoryType, InnerCreateView());
                    }
                }, lowPriority: true);

                if (cachedView != null) {
                    return cachedView;
                }
            }

            return InnerCreateView();
        }

        private static bool hotReloadAgentVariablesCleared;

        /// <summary>
        /// Under "dotnet watch", the .NET hot reload agent is injected into the application through environment
        /// variables (a startup hook and a named pipe). The browser helper processes are .NET processes as well and
        /// would inherit them: each helper then runs the agent at startup and waits for a handshake on a pipe only the
        /// application owns, so no view ever renders. The agent is already loaded in this process by the time this runs,
        /// so clearing the variables here keeps hot reload working while the helpers start clean.
        /// </summary>
        private static void KeepHotReloadAgentOutOfBrowserProcesses() {
            if (hotReloadAgentVariablesCleared || Environment.GetEnvironmentVariable("DOTNET_WATCH") == null) {
                return;
            }
            hotReloadAgentVariablesCleared = true;
            foreach (var variable in new[] { "DOTNET_STARTUP_HOOKS", "DOTNET_WATCH_HOTRELOAD_NAMEDPIPE_NAME", "DOTNET_HOTRELOAD_NAMEDPIPE_NAME", "DOTNET_MODIFIABLE_ASSEMBLIES" }) {
                Environment.SetEnvironmentVariable(variable, null);
                if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) {
                    // on unix the runtime only updates its own copy of the environment; the browser helpers are spawned
                    // natively from the real one
                    unsetenv(variable);
                }
            }
        }

        [DllImport("libc", EntryPoint = "unsetenv")]
        private static extern int unsetenv(string name);

        protected ReactView(IViewModule mainModule) {
            View = CreateReactViewInstance(Factory);

            View.Host = this;
            MainModule = mainModule;
            // bind main module (this is needed so that the plugins are available right away)
            View.BindComponent(mainModule);

            ExtraInitialize();
        }

        partial void ExtraInitialize();

        ~ReactView() {
            Dispose();
        }

        public void Dispose() {
            InnerDispose();
            View?.Dispose();
            GC.SuppressFinalize(this);
        }

        protected virtual void InnerDispose() { }

        /// <summary>
        /// Factory used to configure the initial properties of the control.
        /// </summary>
        protected virtual ReactViewFactory Factory => new ReactViewFactory();

        protected void RefreshDefaultStyleSheet() {
            View.DefaultStyleSheet = Factory.DefaultStyleSheet;
            AsyncExecuteInUI(() => CachedViews.Remove(Factory.GetType()), lowPriority: true);
        }

        /// <summary>
        /// Tries to loads the main component.
        /// </summary>
        protected void TryLoadComponent() {
            TryLoadComponent(true);
        }

        /// <summary>
        /// Tries to loads the main component.
        /// </summary>
        /// <param name="ensureViewInitialized">Tries to initialize underlying view if wasn't yet.</param>
        private void TryLoadComponent(bool ensureViewInitialized) {
            if (View.IsMainComponentLoaded) {
                return;
            }

            if (ensureViewInitialized) {
                // we're performing an explicit load and view has not been initialized
                // try initializing it
                AsyncExecuteInUI(() => View.EnsureInitialized(), lowPriority: false);
            }

            View.LoadComponent(MainModule);
        }

        /// <summary>
        /// Retrieves the specified plugin module instance.
        /// </summary>
        /// <typeparam name="T">Type of the plugin to retrieve.</typeparam>
        /// <returns></returns>
        public T WithPlugin<T>() {
            return View.WithPlugin<T>();
        }

        /// <summary>
        /// Enables or disables debug mode.
        /// In debug mode the webview developer tools becomes available pressing F12 and the webview shows an error message at the top with the error details
        /// when a resource fails to load.
        /// </summary>
        public bool EnableDebugMode { get => View.EnableDebugMode; set => View.EnableDebugMode = value; }

        /// <summary>
        /// True when the main component has been rendered.
        /// </summary>
        public bool IsReady => View.IsReady;

        /// <summary>
        /// Gets or sets the control zoom percentage (1 = 100%)
        /// </summary>
        public double ZoomPercentage { get => View.ZoomPercentage; set => View.ZoomPercentage = value; }

        /// <summary>
        /// Event fired when the component is rendered and ready for interaction.
        /// </summary>
        public event Action Ready {
            add { View.Ready += value; }
            remove { View.Ready -= value; }
        }

        /// <summary>
        /// Event fired when an async exception occurs (eg: executing javascript)
        /// </summary>
        public event UnhandledAsyncExceptionEventHandler UnhandledAsyncException {
            add { View.UnhandledAsyncException += value; }
            remove { View.UnhandledAsyncException -= value; }
        }

        /// <summary>
        /// Event fired when a resource fails to load.
        /// </summary>
        public event ResourceLoadFailedEventHandler ResourceLoadFailed {
            add { View.ResourceLoadFailed += value; }
            remove { View.ResourceLoadFailed -= value; }
        }

        /// <summary>
        /// Handle embedded resource requests. You can use this event to change the resource being loaded.
        /// </summary>
        public event ResourceRequestedEventHandler EmbeddedResourceRequested {
            add { View.EmbeddedResourceRequested += value; }
            remove { View.EmbeddedResourceRequested -= value; }
        }

        /// <summary>
        /// Handle custom resource requests. Use this event to load the resource based on the provided key.
        /// This handler will be called before the frame handler.
        /// </summary>
        public event CustomResourceRequestedEventHandler CustomResourceRequested {
            add { View.CustomResourceRequested += value; }
            remove { View.CustomResourceRequested -= value; }
        }

        /// <summary>
        /// Handle external resource requests.
        /// Call <see cref="ResourceHandler.BeginAsyncResponse"/> to handle the request in an async way.
        /// </summary>
        public event ResourceRequestedEventHandler ExternalResourceRequested {
            add { View.ExternalResourceRequested += value; }
            remove { View.ExternalResourceRequested -= value; }
        }

        /// <summary>
        /// Handle drag of files. Use this event to get the full path of the files being dragged.
        /// </summary>
        public event FilesDraggingEventHandler FilesDragging {
            add { View.FilesDragging += value; }
            remove { View.FilesDragging -= value; }
        }

        /// <summary>
        /// Handle drag of text. Use this event to get the text content being dragged.
        /// </summary>
        public event TextDraggingEventHandler TextDragging {
            add { View.TextDragging += value; }
            remove { View.TextDragging -= value; }
        }

        /// <summary>
        /// Opens the developer tools.
        /// </summary>
        public void ShowDeveloperTools() {
            View.ShowDeveloperTools();
        }

        /// <summary>
        /// Closes the developer tools.
        /// </summary>
        public void CloseDeveloperTools() {
            View.CloseDeveloperTools();
        }

        /// <summary>
        /// View module of this control.
        /// </summary>
        protected IViewModule MainModule { get; }

        /// <summary>
        /// Number of preloaded views that are mantained in cache for each view.
        /// Components with different property values are stored in different cache entries.
        /// Defaults to 6.
        /// </summary>
        public static int PreloadedCacheEntriesSize { get; set; } = 6;

        /// <summary>
        /// Gets the edition commands.
        /// </summary>
        public EditCommands EditCommands => View.EditCommands;

        /// <summary>
        /// Called when executing a native method.
        /// </summary>
        protected virtual Task<object> OnNativeMethodCalled(Func<object> nativeMethod) => Task.FromResult(nativeMethod());

        /// <summary>
        /// Called before executing/evaluating a JS method
        /// </summary>
        protected virtual void OnBeforeExecuteMethod() { }

        internal void HandledBeforeExecuteMethod() => OnBeforeExecuteMethod();

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        internal Task<object> CallNativeMethod(Func<object> nativeMethod) => OnNativeMethodCalled(nativeMethod);
    }
}