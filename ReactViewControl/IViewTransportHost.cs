using System;

namespace ReactViewControl;

/// <summary>
/// The view, as seen by its transport.
/// </summary>
public interface IViewTransportHost {

    /// <summary>
    /// True while the document must ignore keyboard and mouse input.
    /// </summary>
    bool IsInputDisabled { get; }

    /// <summary>
    /// Gets the function that loads the custom resource at the specified url (custom://resource/frame/?key&amp;options).
    /// </summary>
    /// <returns>False when the view has no handler for the url.</returns>
    bool TryGetCustomResourceLoader(string url, out Func<Resource> loadResource);
}
