using System;
using ReactViewControl;
using WebViewControl;

namespace Sample.Avalonia {

    internal class ExtendedReactViewFactory : ReactViewFactory {

        public override ResourceUrl DefaultStyleSheet =>
            new ResourceUrl(typeof(ExtendedReactViewFactory).Assembly, "Generated", Settings.IsLightTheme ? "LightTheme.css" : "DarkTheme.css");

        public override IViewModule[] InitializePlugins() {
            return new[]{
                new ViewPlugin()
            };
        }

        public override bool ShowDeveloperTools => false;

        public override bool EnableViewPreload => true;

#if DEBUG
        public override bool EnableDebugMode => true;

        public override Uri DevServerURI => null;
#endif
    }
}
