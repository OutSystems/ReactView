using System;
using ReactViewControl;

namespace Example.Avalonia {

    public abstract class ExtendedReactView : ReactView {

        protected override ReactViewFactory Factory => new ExtendedReactViewFactory();

        public ExtendedReactView(IViewModule mainModule) : base(mainModule) {
            Settings.StylePreferenceChanged += OnStylePreferenceChanged;
            EmbeddedResourceRequested += ExtendedReactView_EmbeddedResourceRequested;
        }

        private void ExtendedReactView_EmbeddedResourceRequested(WebViewControl.ResourceHandler resourceHandler) {
            var resourceUrl = resourceHandler.Url;

            if (resourceUrl.Contains("ReactViewResources")) {
                return;
            }

            resourceUrl = new Uri(resourceUrl).PathAndQuery;
            var devServerHost = new Uri(Factory.DevServerURI.GetLeftPart(UriPartial.Authority));
            resourceHandler.Redirect(new Uri(devServerHost, resourceUrl).ToString());
        }

        protected override void InnerDispose() {
            base.InnerDispose();
            Settings.StylePreferenceChanged -= OnStylePreferenceChanged;
        }

        private void OnStylePreferenceChanged() {
            RefreshDefaultStyleSheet();
        }
    }

    public class WebPackDependenciesProviderFactory : IModuleDependenciesProviderFactory {

        private readonly WebPackDependenciesProvider provider = new WebPackDependenciesProvider(new System.Uri("http://localhost:8080/Example.Avalonia/"));

        public IModuleDependenciesProvider CreateDependenciesProviderInstance(string filename) {
            provider.RefreshDependencies();
            return provider;
        }
    }
}
