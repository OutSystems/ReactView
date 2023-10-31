using System;
using ReactViewControl;
using WebViewControl;

namespace Sample.Avalonia {

    internal class ExtendedReactViewFactory : ReactViewFactory {
        private static WebPackDependenciesProvider provider = new WebPackDependenciesProvider(new Uri("http://localhost:8080/Sample.Avalonia/"));

        public override ResourceUrl DefaultStyleSheet =>
            new ResourceUrl(typeof(ExtendedReactViewFactory).Assembly, "Generated", Settings.IsLightTheme ? "LightTheme.css" : "DarkTheme.css");

        public override IViewModule[] InitializePlugins() {
            var viewPlugin = new ViewPlugin();
#if DEBUG
            if (provider != null) {
                viewPlugin.DependenciesProvider = provider;
            }
#endif
            return new[]{
                viewPlugin
            };
        }

        public override bool ShowDeveloperTools => false;

        public override bool EnableViewPreload => true;

#if DEBUG
        public override bool EnableDebugMode => true;

        public override IModuleDependenciesProvider ModuleDependenciesProvider =>
            provider;
#endif
    }
}