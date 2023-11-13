using System;
using ReactViewControl;

namespace Sample.Avalonia {

    public partial class ExtendedReactView : ReactView {

#if DEBUG
        private static readonly Uri DevServerUri;
        
        static ExtendedReactView() {
            var uri = Environment.GetEnvironmentVariable("DEV_SERVER_URI");
            if (uri != null) {
                DevServerUri = new Uri(uri);
            }
        }
        
        private static void OnEmbeddedResourceRequested(WebViewControl.ResourceHandler resourceHandler) {
            var resourceUrl = resourceHandler.Url;

            if (resourceUrl.Contains("ReactViewResources")) {
                return;
            }

            resourceUrl = new Uri(resourceUrl).PathAndQuery;
            resourceHandler.Redirect(new Uri(DevServerUri, resourceUrl).ToString());
        }
#endif
        
        protected override ReactViewFactory Factory => new ExtendedReactViewFactory();

        public ExtendedReactView(IViewModule mainModule) : base(mainModule) {
            Settings.ThemeChanged += OnStylePreferenceChanged;

#if DEBUG
            if (DevServerUri != null) {
                EmbeddedResourceRequested += OnEmbeddedResourceRequested;
            }
#endif
        }

        protected override void InnerDispose() {
            base.InnerDispose();
            Settings.ThemeChanged -= OnStylePreferenceChanged;
        }

        private void OnStylePreferenceChanged() {
            RefreshDefaultStyleSheet();
        }
    }
}