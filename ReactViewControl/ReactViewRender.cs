﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using WebViewControl;

namespace ReactViewControl {

    internal partial class ReactViewRender : IChildViewHost, IDisposable {

#if DEBUG
        private static int counter;
        private int id = counter++;
#endif

        private object SyncRoot { get; } = new object();

        private const string CustomResourceBaseUrl = "resource";

        private static Assembly ResourcesAssembly { get; } = typeof(ReactViewResources.Resources).Assembly;

        private Dictionary<string, FrameInfo> Frames { get; } = new Dictionary<string, FrameInfo>();

        private WebView WebView { get; }
        private Assembly UserCallingAssembly { get; }
        private LoaderModule Loader { get; }
        private Func<IViewModule[]> PluginsFactory { get; }
        private bool ForceNativeSyncCalls { get; }

        private bool enableDebugMode;
        private ResourceUrl defaultStyleSheet;
        private bool isInputDisabled; // used primarly to control the intention to disable input (before the browser is ready)

        public ReactViewRender(ResourceUrl defaultStyleSheet, Func<IViewModule[]> initializePlugins, bool preloadWebView, int maxNativeMethodsParallelCalls, bool enableDebugMode, Uri devServerUri = null) {
            UserCallingAssembly = ResourceUrl.GetUserCallingMethod().ReflectedType.Assembly;
            
            // must useSharedDomain for the local storage to be shared
            WebView = new WebView(useSharedDomain: true) {
                DisableBuiltinContextMenus = true,
                IsSecurityDisabled = true,
                IgnoreMissingResources = false,
                IsHistoryDisabled = true,
                MaxNativeMethodsParallelCalls = maxNativeMethodsParallelCalls
            };

            NativeAPI.Initialize(this);
            Loader = new LoaderModule(this);

            ForceNativeSyncCalls = maxNativeMethodsParallelCalls == 1;
            DefaultStyleSheet = defaultStyleSheet;
            PluginsFactory = initializePlugins;
            EnableDebugMode = enableDebugMode;
            DevServerUri = devServerUri;

            GetOrCreateFrame(FrameInfo.MainViewFrameName); // creates the main frame

            WebView.Disposed += Dispose;
            WebView.BeforeNavigate += OnWebViewBeforeNavigate;
            WebView.BeforeResourceLoad += OnWebViewBeforeResourceLoad;
            WebView.LoadFailed += OnWebViewLoadFailed;
            WebView.FilesDragging += fileNames => FilesDragging?.Invoke(fileNames);
            WebView.TextDragging += textContent => TextDragging?.Invoke(textContent);

            ExtraInitialize();

            var urlParams = new string[] {
                new ResourceUrl(ResourcesAssembly).ToString(),
                enableDebugMode ? "true" : "false",
                ExecutionEngine.ModulesObjectName,
                NativeAPI.NativeObjectName,
                ResourceUrl.CustomScheme +  Uri.SchemeDelimiter + CustomResourceBaseUrl
            };

            WebView.LoadResource(new ResourceUrl(ResourcesAssembly, ReactViewResources.Resources.DefaultUrl + "?" + string.Join("&", urlParams)));

            if (preloadWebView) {
                PreloadWebView();
            }
        }

        partial void ExtraInitialize();

        partial void PreloadWebView();

        public ReactView Host { get; set; }

        /// <summary>
        /// True when hot reload is enabled.
        /// </summary>
        public bool IsHotReloadEnabled => DevServerUri != null;

        public bool IsDisposing => WebView.IsDisposing;

        /// <summary>
        /// True when the main component has been rendered.
        /// </summary>
        public bool IsReady => Frames.TryGetValue(FrameInfo.MainViewFrameName, out var frame) && frame.LoadStatus == LoadStatus.Ready;

        /// <summary>
        /// True when view component is loading or loaded
        /// </summary>
        public bool IsMainComponentLoaded => Frames.TryGetValue(FrameInfo.MainViewFrameName, out var frame) && frame.LoadStatus >= LoadStatus.ComponentLoading;

        /// <summary>
        /// Enables or disables debug mode. 
        /// In debug mode the webview developer tools becomes available pressing F12 and the webview shows an error message at the top with the error details 
        /// when a resource fails to load.
        /// </summary>
        public bool EnableDebugMode {
            get { return enableDebugMode; }
            set {
                enableDebugMode = value;
                WebView.AllowDeveloperTools = enableDebugMode;
                if (enableDebugMode) {
                    WebView.ResourceLoadFailed += Loader.ShowResourceLoadFailedMessage;
                } else {
                    WebView.ResourceLoadFailed -= Loader.ShowResourceLoadFailedMessage;
                }
            }
        }

        /// <summary>
        /// Gets webpack dev server url.
        /// </summary>
        public Uri DevServerUri { get; }

        /// <summary>
        /// Gets or sets the webview zoom percentage (1 = 100%)
        /// </summary>
        public double ZoomPercentage {
            get { return WebView.ZoomPercentage; }
            set { WebView.ZoomPercentage = value; }
        }

        /// <summary>
        /// Event fired when the component is rendered and ready for interaction.
        /// </summary>
        public event Action Ready;

        /// <summary>
        /// Event fired when an async exception occurs (eg: executing javascript)
        /// </summary>
        public event UnhandledAsyncExceptionEventHandler UnhandledAsyncException {
            add { WebView.UnhandledAsyncException += value; }
            remove { WebView.UnhandledAsyncException -= value; }
        }

        /// <summary>
        /// Event fired when a resource fails to load.
        /// </summary>
        public event ResourceLoadFailedEventHandler ResourceLoadFailed {
            add { WebView.ResourceLoadFailed += value; }
            remove { WebView.ResourceLoadFailed -= value; }
        }

        /// <summary>
        /// Handle embedded resource requests. You can use this event to change the resource being loaded.
        /// </summary>
        public event ResourceRequestedEventHandler EmbeddedResourceRequested;

        /// <summary>
        /// Handle external resource requests. 
        /// Call <see cref="WebView.ResourceHandler.BeginAsyncResponse"/> to handle the request in an async way.
        /// </summary>
        public event ResourceRequestedEventHandler ExternalResourceRequested;

        /// <summary>
        /// Handle custom resource requests. Use this event to load the resource based on provided key.
        /// </summary>
        public event CustomResourceRequestedEventHandler CustomResourceRequested;

        /// <summary>
        /// Handle drag of files. Use this event to get the full path of the files being dragged.
        /// </summary>
        internal event FilesDraggingEventHandler FilesDragging;

        /// <summary>
        /// Handle drag of text. Use this event to get the text content being dragged.
        /// </summary>
        internal event TextDraggingEventHandler TextDragging;

        /// <summary>
        /// Javascript context was destroyed, cleanup everthing.
        /// </summary>
        /// <param name="frameName"></param>
        private void OnWebViewJavascriptContextReleased(string frameName) {
            if (!WebView.IsMainFrame(frameName)) {
                // ignore, its an iframe saying goodbye
                return;
            }

            lock (SyncRoot) {
                var mainFrame = Frames[FrameInfo.MainViewFrameName];
                Frames.Clear();
                Frames.Add(mainFrame.Name, mainFrame);
                var previousComponentReady = mainFrame.IsComponentReadyToLoad;
                mainFrame.Reset();
                mainFrame.IsComponentReadyToLoad = previousComponentReady;
            }
        }

        public void Dispose() {
            WebView.Dispose();
        }

        /// <summary>
        /// Binds the specified component to the main frame.
        /// </summary>
        /// <param name="component"></param>
        public void BindComponent(IViewModule component) {
            lock (SyncRoot) {
                var frame = GetOrCreateFrame(FrameInfo.MainViewFrameName);
                BindComponentToFrame(component, frame);
            }
        }

        /// <summary>
        /// Load the specified component into the main frame.
        /// </summary>
        /// <param name="component"></param>
        public void LoadComponent(IViewModule component) {
            lock (SyncRoot) {
                var frame = GetOrCreateFrame(FrameInfo.MainViewFrameName);
                frame.IsComponentReadyToLoad = true;
                TryLoadComponent(frame);
            }
        }

        void IChildViewHost.LoadComponent(string frameName, IViewModule component) {
            lock (SyncRoot) {
                var frame = GetOrCreateFrame(frameName);
                if (frame.Component == null) {
                    // component not bound yet? bind it
                    BindComponentToFrame(component, frame);
                }
                frame.IsComponentReadyToLoad = true;
                TryLoadComponent(frame);
            }
        }

        /// <summary>
        /// Loads the frame component.
        /// </summary>
        /// <param name="frame"></param>
        private void TryLoadComponent(FrameInfo frame) {
            if (frame.Component != null && frame.LoadStatus == LoadStatus.ViewInitialized && frame.IsComponentReadyToLoad) {
                frame.LoadStatus = LoadStatus.ComponentLoading;

                RegisterNativeObject(frame.Component, frame);

                Loader.LoadComponent(frame.Component, frame.Name, DefaultStyleSheet != null, frame.Plugins.Length > 0, ForceNativeSyncCalls);
                if (isInputDisabled && frame.IsMain) {
                    Loader.DisableInputInteractions(true);
                }
            }
        }

        /// <summary>
        /// Gets or sets the url of the default stylesheet.
        /// </summary>
        public ResourceUrl DefaultStyleSheet {
            get { return defaultStyleSheet; }
            set {
                if (IsMainComponentLoaded) {
                    Loader.LoadDefaultStyleSheet(value);
                }
                defaultStyleSheet = value;
            }
        }

        private void AddPlugins(IViewModule[] plugins, FrameInfo frame) {
            var invalidPlugins = plugins.Where(p => string.IsNullOrEmpty(p.MainJsSource) || string.IsNullOrEmpty(p.Name) || string.IsNullOrEmpty(p.NativeObjectName));
            if (invalidPlugins.Any()) {
                var pluginName = invalidPlugins.First().Name + "|" + invalidPlugins.First().GetType().Name;
                throw new ArgumentException($"Plugin '{pluginName}' is invalid");
            }
            
            if (frame.LoadStatus > LoadStatus.ViewInitialized) {
                throw new InvalidOperationException($"Cannot add plugins after component has been loaded");
            }

            frame.Plugins = frame.Plugins.Concat(plugins).ToArray();

            foreach (var plugin in plugins) {
                plugin.Bind(frame);
            }
        }

        /// <summary>
        /// Retrieves the specified plugin module instance for the spcifies frame.
        /// </summary>
        /// <typeparam name="T">Type of the plugin to retrieve.</typeparam>
        /// <param name="frameName"></param>
        /// <exception cref="InvalidOperationException">If the plugin hasn't been registered on the specified frame.</exception>
        /// <returns></returns>
        public T WithPlugin<T>(string frameName = FrameInfo.MainViewFrameName) {
            if (!Frames.TryGetValue(frameName, out var frame)) {
                throw new InvalidOperationException($"Frame {frameName} is not loaded");
            }

            return frame.GetPlugin<T>();
        }

        /// <summary>
        /// Opens the developer tools.
        /// </summary>
        public void ShowDeveloperTools() {
            WebView.ShowDeveloperTools();
        }

        /// <summary>
        /// Closes the developer tools.
        /// </summary>
        public void CloseDeveloperTools() {
            WebView.CloseDeveloperTools();
        }

        /// <summary>
        /// Add an handler for custom resources from the specified frame.
        /// </summary>
        /// <param name="frameName"></param>
        /// <param name="handler"></param>
        public void AddCustomResourceRequestedHandler(string frameName, CustomResourceRequestedEventHandler handler) {
            lock (SyncRoot) {
                var frame = GetOrCreateFrame(frameName);
                frame.CustomResourceRequestedHandler += handler;
            }
        }

        /// <summary>
        /// Remve the handler for custom resources from the specified frame.
        /// </summary>
        /// <param name="frameName"></param>
        /// <param name="handler"></param>
        public void RemoveCustomResourceRequestedHandler(string frameName, CustomResourceRequestedEventHandler handler) {
            // do not create if frame does not exist
            if (Frames.TryGetValue(frameName, out var frame)) {
                frame.CustomResourceRequestedHandler -= handler;
            }
        }

        /// <summary>
        /// Gets the view loaded on the specified frame. If none it will create a view of the specified 
        /// instance and bind it to the frame.
        /// </summary>
        /// <param name="frameName"></param>
        /// <returns></returns>
        public T GetOrAddChildView<T>(string frameName) where T : IViewModule, new() {
            T component;
            lock (SyncRoot) {
                var frame = GetOrCreateFrame(frameName);
                if (frame.Component == null) {
                    component = new T();
                    BindComponentToFrame(component, frame);
                } else {
                    component = (T) frame.Component;
                }
            }

            return component;
        }

        /// <summary>
        /// Binds the coponent to the specified frame.
        /// </summary>
        /// <param name="component"></param>
        /// <param name="frame"></param>
        private void BindComponentToFrame(IViewModule component, FrameInfo frame) {
            frame.Component = component;
            component.Bind(frame, this);
        }

        /// <summary>
        /// Handles webview url load request.
        /// </summary>
        /// <param name="request"></param>
        private void OnWebViewBeforeNavigate(Request request) {
            if (request.IsMainFrame && !request.Url.StartsWith(ResourceUrl.EmbeddedScheme)) {
                UrlHelper.OpenInExternalBrowser(request.Url);
                request.Cancel();
            }
        }

        /// <summary>
        /// Handles the webview load of resources
        /// </summary>
        /// <param name="resourceHandler"></param>
        private void OnWebViewBeforeResourceLoad(ResourceHandler resourceHandler) {
            var url = resourceHandler.Url;
            var scheme = url.Substring(0, Math.Max(0, url.IndexOf(Uri.SchemeDelimiter)));

            switch (scheme.ToLowerInvariant()) {
                case ResourceUrl.CustomScheme:
                    HandleCustomResourceRequested(resourceHandler);
                    break;

                case ResourceUrl.EmbeddedScheme:
                    // webview already started BeginAsyncResponse
                    EmbeddedResourceRequested?.Invoke(resourceHandler);
                    break;

                case "http":
                case "https":
                    ExternalResourceRequested?.Invoke(resourceHandler);
                    break;
            }
        }

        /// <summary>
        /// Handles webview load errors.
        /// </summary>
        /// <param name="url"></param>
        /// <param name="errorCode"></param>
        /// <param name="frameName">The iframe name, not to be confused with view frame name</param>
        private void OnWebViewLoadFailed(string url, int errorCode, string frameName) {
            if (!WebView.IsMainFrame(frameName)) {
                // ignore errors in iframes
                return;
            }

            throw new Exception($"Failed to load view (error: {errorCode})");
        }

        private CustomResourceRequestedEventHandler[] GetCustomResourceHandlers(FrameInfo frame) {
            var globalHandlers = CustomResourceRequested?.GetInvocationList().Cast<CustomResourceRequestedEventHandler>() ?? Enumerable.Empty<CustomResourceRequestedEventHandler>();
            var frameHandlers = frame.CustomResourceRequestedHandler?.GetInvocationList().Cast<CustomResourceRequestedEventHandler>() ?? Enumerable.Empty<CustomResourceRequestedEventHandler>();
            return globalHandlers.Concat(frameHandlers).ToArray();
        }

        /// <summary>
        /// Handle custom resource request and forward it to the appropriate frame.
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        private void HandleCustomResourceRequested(ResourceHandler resourceHandler) {
            var url = resourceHandler.Url;
            
            if (Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Segments.Length > 1 && uri.Host.Equals(CustomResourceBaseUrl, StringComparison.InvariantCultureIgnoreCase)) {
                var frameName = uri.Segments.ElementAt(1).TrimEnd(ResourceUrl.PathSeparator.ToCharArray());
                if (frameName != null && Frames.TryGetValue(frameName, out var frame)) {
                    var customResourceRequestedHandlers = GetCustomResourceHandlers(frame);
                    if (customResourceRequestedHandlers.Any()) {
                        resourceHandler.BeginAsyncResponse(() => {
                            // get resource key from the query params
                            var resourceKeyAndOptions = uri.Query.TrimStart('?').Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries).Select(p => Uri.UnescapeDataString(p));
                            var resourceKey = resourceKeyAndOptions.FirstOrDefault();
                            var options = resourceKeyAndOptions.Skip(1).ToArray();

                            // get response from first handler that returns a stream
                            var response = customResourceRequestedHandlers.Select(h => h(resourceKey, options)).FirstOrDefault(r => r != null);

                            if (response != null) {
                                var extension = Path.GetExtension(resourceKey).TrimStart('.');
                                resourceHandler.RespondWith(response, extension);
                            } else {
                                resourceHandler.RespondWith(MemoryStream.Null);
                            }
                        });
                    }
                }
            }
        }

        /// <summary>
        /// Registers a .net object to be available on the js context.
        /// </summary>
        /// <param name="module"></param>
        /// <param name="frameName"></param>
        /// <param name="forceNativeSyncCalls"></param>
        private void RegisterNativeObject(IViewModule module, FrameInfo frame) {
            var nativeObjectName = module.GetNativeObjectFullName(frame.Name);
            WebView.RegisterJavascriptObject(nativeObjectName, module.CreateNativeObject(), interceptCall: CallNativeMethod, executeCallsInUI: false);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private object CallNativeMethod(Func<object> nativeMethod) {
            if (Host != null) {
                return Host.CallNativeMethod(nativeMethod);
            }
            return nativeMethod();
        }

        /// <summary>
        /// Unregisters a .net object available on the js context.
        /// </summary>
        /// <param name="module"></param>
        /// <param name="frameName"></param>
        private void UnregisterNativeObject(IViewModule module, FrameInfo frame) {
            var nativeObjectName = module.GetNativeObjectFullName(frame.Name);
            WebView.UnregisterJavascriptObject(nativeObjectName);
        }

        /// <summary>
        /// Converts an url to a full path url
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        private string ToFullUrl(string url) {
            if (url.Contains(Uri.SchemeDelimiter)) {
                return url;
            } else if (url.StartsWith(ResourceUrl.PathSeparator)) {
                if (IsHotReloadEnabled) {
                    return new Uri(DevServerUri, url).ToString();
                } else {
                    return new ResourceUrl(ResourceUrl.EmbeddedScheme, url).ToString();
                }
            } else {
                return new ResourceUrl(UserCallingAssembly, url).ToString();
            }
        }

        /// <summary>
        /// Normalizes the url path separators
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        private static string NormalizeUrl(string url) {
            return url.Replace("\\", ResourceUrl.PathSeparator);
        }

        /// <summary>
        /// Disables or enables keyboard and mouse interactions with the browser
        /// </summary>
        /// <param name="disable"></param>
        private void DisableInputInteractions(bool disable) {
            if (isInputDisabled == disable) {
                return;
            }
            lock (SyncRoot) {
                if (isInputDisabled == disable) {
                    return;
                }
                isInputDisabled = disable;
                var frame = GetOrCreateFrame(FrameInfo.MainViewFrameName);
                if (frame.LoadStatus >= LoadStatus.ComponentLoading) {
                    Loader.DisableInputInteractions(disable);
                }
            }
        }

        private FrameInfo GetOrCreateFrame(string frameName) {
            if (!Frames.TryGetValue(frameName, out var frame)) {
                frame = new FrameInfo(frameName);
                Frames[frameName] = frame;
                AddPlugins(PluginsFactory(), frame);
            }
            return frame;
        }
    }
}