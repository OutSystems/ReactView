using System;
using Avalonia;
using Avalonia.Controls;
using Avalonia.LogicalTree;
using ReactViewControl;

namespace Sample.Avalonia {

    public partial class ExtendedReactView : ReactView {

#if DEBUG
        private static readonly Uri DevServerUri;
        
        static ExtendedReactView() {
            var uri = Environment.GetEnvironmentVariable("DEV_SERVER_URI");
            if (uri == null) {
                return;
            }

            DevServerUri = new Uri(uri);
            ModuleDependenciesProviderFactory.Instance = new HotReloadDependenciesProviderFactory(uri);
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
            
            this.AttachedToVisualTree += OnViewAttachedToVisualTree;
            this.DetachedFromVisualTree += OnViewDetachedToVisualTree;
#if DEBUG
            if (DevServerUri != null) {
                EmbeddedResourceRequested += OnEmbeddedResourceRequested;
            }
#endif
        }

        protected override void InnerDispose() {
            base.InnerDispose();
            Settings.ThemeChanged -= OnStylePreferenceChanged;
            this.AttachedToVisualTree -= OnViewAttachedToVisualTree;
            this.DetachedFromVisualTree -= OnViewDetachedToVisualTree;
        }

        private void OnStylePreferenceChanged() {
            RefreshDefaultStyleSheet();
        }
        
        private void OnViewAttachedToVisualTree(object sender, VisualTreeAttachmentEventArgs e) {
            if (e.Root is WindowBase windowBase) {
                windowBase.Activated += OnActivated;
            }
        }

        private void OnViewDetachedToVisualTree(object sender, VisualTreeAttachmentEventArgs e) {
            if (e.Root is WindowBase windowBase) {
                windowBase.Activated -= OnActivated;
            }
        }

        private void OnActivated(object sender, EventArgs e) {
            this.Focus();
        }
    }
}