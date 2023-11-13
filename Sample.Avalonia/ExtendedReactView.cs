using System;
using ReactViewControl;

namespace Sample.Avalonia {

    public abstract class ExtendedReactView : ReactView {

        protected override ReactViewFactory Factory => new ExtendedReactViewFactory();

        public ExtendedReactView(IViewModule mainModule) : base(mainModule) {
            Settings.ThemeChanged += OnStylePreferenceChanged;

            if (Factory.ModuleDependenciesProvider != null) {
                EmbeddedResourceRequested += OnEmbeddedResourceRequested;
            }
        }

        protected override void InnerDispose() {
            base.InnerDispose();
            Settings.ThemeChanged -= OnStylePreferenceChanged;
        }

        private void OnStylePreferenceChanged() {
            RefreshDefaultStyleSheet();
        }

        private void OnEmbeddedResourceRequested(WebViewControl.ResourceHandler resourceHandler) {
            var resourceUrl = resourceHandler.Url;

            if (resourceUrl.Contains("ReactViewResources")) {
                return;
            }

            resourceUrl = new Uri(resourceUrl).PathAndQuery;
            var devServerHost = new Uri("http://localhost:8080/"); //new Uri(Factory.DevServerURI.GetLeftPart(UriPartial.Authority));
            resourceHandler.Redirect(new Uri(devServerHost, resourceUrl).ToString());
        }
    }
}