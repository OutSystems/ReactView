using System;
using System.Threading.Tasks;
using WebViewControl;

namespace ReactViewControl;

/// <summary>
/// Connects a view to the document that renders it. The default transport is an embedded browser; another
/// transport can render the document somewhere else, such as a remote browser.
/// </summary>
public interface IViewTransport : IDisposable {

    /// <summary>
    /// Control to add to the view's visual tree, or null when the document is rendered elsewhere.
    /// </summary>
    object Control { get; }

    bool IsDisposing { get; }

    /// <summary>
    /// True when the document renderer has been created.
    /// </summary>
    bool IsInitialized { get; }

    bool AllowDeveloperTools { get; set; }

    double ZoomPercentage { get; set; }

    event Action Disposed;

    /// <summary>
    /// The javascript context of the main document was released, eg: the document was reloaded.
    /// </summary>
    event Action JavascriptContextReleased;

    event UnhandledAsyncExceptionEventHandler UnhandledAsyncException;

    event ResourceLoadFailedEventHandler ResourceLoadFailed;

    /// <summary>
    /// Raised only by transports that load the embedded resources themselves.
    /// </summary>
    event ResourceRequestedEventHandler EmbeddedResourceRequested;

    /// <summary>
    /// Raised only by transports that load the external resources themselves.
    /// </summary>
    event ResourceRequestedEventHandler ExternalResourceRequested;

    event FilesDraggingEventHandler FilesDragging;

    event TextDraggingEventHandler TextDragging;

    /// <summary>
    /// Creates the document renderer with the specified initial size.
    /// </summary>
    void Initialize(int width, int height);

    /// <summary>
    /// Loads the main document.
    /// </summary>
    void LoadResource(ResourceUrl url);

    /// <summary>
    /// Converts an embedded or custom resource url into the url the document uses to load it.
    /// </summary>
    string ToDocumentUrl(string url);

    /// <summary>
    /// Makes an object available in the javascript context of the main document.
    /// </summary>
    /// <param name="interceptCall">Optional method that intercepts every call to the object.</param>
    /// <returns>False if an object with the same name was already registered.</returns>
    bool RegisterJavascriptObject(string name, object objectToBind, Func<Func<object>, Task<object>> interceptCall = null);

    void UnregisterJavascriptObject(string name);

    void ExecuteScript(string script);

    void ExecuteScriptFunctionWithSerializedParams(string functionName, params object[] args);

    Task<T> EvaluateScriptFunctionWithSerializedParams<T>(string functionName, params object[] args);

    void ShowDeveloperTools();

    void CloseDeveloperTools();

    void Focus();

    void ExecuteEditCommand(EditCommand command);
}
