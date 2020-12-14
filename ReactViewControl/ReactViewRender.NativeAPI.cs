using System.Collections.Generic;
using System.Linq;

namespace ReactViewControl {

    partial class ReactViewRender {

        /// <summary>
        /// Methods of this class will be called by the loader inside the webview.
        /// </summary>
        private class NativeAPI {

            public const string NativeObjectName = "__NativeAPI__";

            private ReactViewRender ViewRender { get; }

            private NativeAPI(ReactViewRender viewRender) {
                ViewRender = viewRender;
                ViewRender.WebView.RegisterJavascriptObject(NativeObjectName, this);
            }

            public static void Initialize(ReactViewRender viewRender) {
                new NativeAPI(viewRender);
            }

            /// <summary>
            /// A view was initialized, load its component.
            /// </summary>
            public void NotifyViewInitialized(string frameName) {
                lock (ViewRender.SyncRoot) {
                    var frame = ViewRender.GetOrCreateFrame(frameName);
                    frame.LoadStatus = LoadStatus.ViewInitialized;

                    if (frame.IsMain) {
                        // from now on we have to watch for js context released
                        ViewRender.WebView.JavascriptContextReleased -= ViewRender.OnWebViewJavascriptContextReleased;
                        ViewRender.WebView.JavascriptContextReleased += ViewRender.OnWebViewJavascriptContextReleased;

                        // only need to load the stylesheet for the main frame
                        LoadStyleSheet();
                    }

                    LoadPlugins(frame);

                    ViewRender.TryLoadComponent(frame);
                }
            }

            /// <summary>
            /// Handle component loaded event: component is loaded and ready for interaction.
            /// </summary>
            public void NotifyViewLoaded(string frameName, string id) {
                lock (ViewRender.SyncRoot) {
                    var frame = ViewRender.GetOrCreateFrame(frameName);
                    frame.LoadStatus = LoadStatus.Ready;

#if DEBUG
                    System.Diagnostics.Debug.WriteLine($"View '{frameName}' loaded (id: '{id}')");
#endif
                    // start component execution engine
                    frame.ExecutionEngine.Start(ViewRender.WebView, frameName, id);

                    if (frame.IsMain) {
                        ReactView.AsyncExecuteInUI(() => ViewRender.Ready?.Invoke(), false);
                    }
                }
            }

            /// <summary>
            /// An inner view was destroyed, cleanup its resources.
            /// </summary>
            public void NotifyViewDestroyed(string frameName) {
                lock (ViewRender.SyncRoot) {
                    if (ViewRender.Frames.TryGetValue(frameName, out var frame)) {
                        IEnumerable<IViewModule> modules = frame.Plugins;
                        if (frame.Component != null) {
                            modules = modules.Concat(new[] { frame.Component });
                        }
                        foreach (var module in modules) {
                            ViewRender.UnregisterNativeObject(module, frame);
                        }
                        ViewRender.Frames.Remove(frameName);
                    }
                }
            }

            /// <summary>
            /// Load stylesheet
            /// </summary>
            private void LoadStyleSheet() {
                var stylesheet = ViewRender.DefaultStyleSheet;
                if (stylesheet != null) {
                    ViewRender.Loader.LoadDefaultStyleSheet(stylesheet);
                }
            }

            /// <summary>
            /// Load plugins of the specified frame.
            /// </summary>
            /// <param name="frame"></param>
            private void LoadPlugins(FrameInfo frame) {
                if (frame.Plugins.Length > 0) {
                    foreach (var module in frame.Plugins) {
                        ViewRender.RegisterNativeObject(module, frame);
                    }

                    ViewRender.Loader.LoadPlugins(frame.Plugins, frame.Name);
                }
            }
        }
    }
}
