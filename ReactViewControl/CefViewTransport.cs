using System;
using System.IO;
using System.Threading.Tasks;
using WebViewControl;
using Xilium.CefGlue;

namespace ReactViewControl;

/// <summary>
/// Renders the document in an embedded Chromium browser.
/// </summary>
internal class CefViewTransport : IViewTransport {

    public CefViewTransport(IViewTransportHost host) {
        Host = host;

        // must useSharedDomain for the local storage to be shared
        WebView = new ExtendedWebView(useSharedDomain: true) {
            DisableBuiltinContextMenus = true,
            IsSecurityDisabled = true,
            IgnoreMissingResources = false,
            IsHistoryDisabled = true,
            Focusable = true
        };

        WebView.BeforeNavigate += OnWebViewBeforeNavigate;
        WebView.BeforeResourceLoad += OnWebViewBeforeResourceLoad;
        WebView.LoadFailed += OnWebViewLoadFailed;
        WebView.KeyPressed += OnWebViewKeyPressed;
        WebView.JavascriptContextReleased += OnWebViewJavascriptContextReleased;
    }

    private IViewTransportHost Host { get; }

    internal ExtendedWebView WebView { get; }

    public object Control => WebView;

    public bool IsDisposing => WebView.IsDisposing;

    public bool IsInitialized => WebView.IsBrowserInitialized;

    public bool AllowDeveloperTools {
        get => WebView.AllowDeveloperTools;
        set => WebView.AllowDeveloperTools = value;
    }

    public double ZoomPercentage {
        get => WebView.ZoomPercentage;
        set => WebView.ZoomPercentage = value;
    }

    public event Action Disposed {
        add => WebView.Disposed += value;
        remove => WebView.Disposed -= value;
    }

    public event Action JavascriptContextReleased;

    public event UnhandledAsyncExceptionEventHandler UnhandledAsyncException {
        add => WebView.UnhandledAsyncException += value;
        remove => WebView.UnhandledAsyncException -= value;
    }

    public event ResourceLoadFailedEventHandler ResourceLoadFailed {
        add => WebView.ResourceLoadFailed += value;
        remove => WebView.ResourceLoadFailed -= value;
    }

    public event ResourceRequestedEventHandler EmbeddedResourceRequested;

    public event ResourceRequestedEventHandler ExternalResourceRequested;

    public event FilesDraggingEventHandler FilesDragging {
        add => WebView.FilesDragging += value;
        remove => WebView.FilesDragging -= value;
    }

    public event TextDraggingEventHandler TextDragging {
        add => WebView.TextDragging += value;
        remove => WebView.TextDragging -= value;
    }

    public void Initialize(int width, int height) => WebView.InitializeBrowser(width, height);

    public void LoadResource(ResourceUrl url) => WebView.LoadResource(url);

    public string ToDocumentUrl(string url) => url;

    public bool RegisterJavascriptObject(string name, object objectToBind, Func<Func<object>, Task<object>> interceptCall = null) {
        if (interceptCall == null) {
            return WebView.RegisterJavascriptObject(name, objectToBind);
        }
        return WebView.RegisterJavascriptObject(name, objectToBind, interceptCall);
    }

    public void UnregisterJavascriptObject(string name) => WebView.UnregisterJavascriptObject(name);

    public void ExecuteScript(string script) => WebView.ExecuteScript(script);

    public void ExecuteScriptFunctionWithSerializedParams(string functionName, params object[] args) {
        WebView.ExecuteScriptFunctionWithSerializedParams(functionName, args);
    }

    public Task<T> EvaluateScriptFunctionWithSerializedParams<T>(string functionName, params object[] args) {
        return WebView.EvaluateScriptFunctionWithSerializedParams<T>(functionName, args);
    }

    public void ShowDeveloperTools() => WebView.ShowDeveloperTools();

    public void CloseDeveloperTools() => WebView.CloseDeveloperTools();

    public void Focus() => WebView.Focus();

    public void ExecuteEditCommand(EditCommand command) {
        var editCommands = WebView.EditCommands;
        switch (command) {
            case EditCommand.Cut:
                editCommands.Cut();
                break;
            case EditCommand.Copy:
                editCommands.Copy();
                break;
            case EditCommand.Paste:
                editCommands.Paste();
                break;
            case EditCommand.SelectAll:
                editCommands.SelectAll();
                break;
            case EditCommand.Undo:
                editCommands.Undo();
                break;
            case EditCommand.Redo:
                editCommands.Redo();
                break;
            case EditCommand.Delete:
                editCommands.Delete();
                break;
        }
    }

    public void Dispose() => WebView.Dispose();

    /// <summary>
    /// Handles webview url load request.
    /// </summary>
    /// <param name="request"></param>
    private void OnWebViewBeforeNavigate(Request request) {
        if (request.IsMainFrame && !request.Url.OrdinalStartsWith($"{ResourceUrl.EmbeddedScheme}{Uri.SchemeDelimiter}")) {
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
        var scheme = url.Substring(0, Math.Max(0, url.OrdinalIndexOf(Uri.SchemeDelimiter)));

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
    /// Handle custom resource request and forward it to the view.
    /// </summary>
    /// <param name="resourceHandler"></param>
    private void HandleCustomResourceRequested(ResourceHandler resourceHandler) {
        if (Host.TryGetCustomResourceLoader(resourceHandler.Url, out var loadResource)) {
            resourceHandler.BeginAsyncResponse(() => {
                var resource = loadResource();
                if (resource != null) {
                    resourceHandler.RespondWith(resource.Content, resource.Extension);
                } else {
                    resourceHandler.RespondWith(MemoryStream.Null);
                }
            });
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

    /// <summary>
    /// Handles webview keypresses.
    /// </summary>
    /// <param name="keyEvent"></param>
    /// <param name="handled"></param>
    private void OnWebViewKeyPressed(CefKeyEvent keyEvent, out bool handled) {
        handled = Host.IsInputDisabled;
    }

    /// <summary>
    /// Javascript context was destroyed.
    /// </summary>
    /// <param name="frameName"></param>
    private void OnWebViewJavascriptContextReleased(string frameName) {
        if (!WebView.IsMainFrame(frameName)) {
            // ignore, its an iframe saying goodbye
            return;
        }

        JavascriptContextReleased?.Invoke();
    }
}
