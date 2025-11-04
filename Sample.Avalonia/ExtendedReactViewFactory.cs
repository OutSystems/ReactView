using ReactViewControl;
using WebViewControl;

namespace Sample.Avalonia {

    partial class ExtendedReactView {
        
        protected class ExtendedReactViewFactory : ReactViewFactory {

            public override ResourceUrl DefaultStyleSheet =>
                new(typeof(ExtendedReactViewFactory).Assembly, "Generated",
                    Settings.IsLightTheme ? "LightTheme.css" : "DarkTheme.css");

            public override IViewModule[] InitializePlugins() {
                var viewPlugin = new ViewPlugin();
                return new IViewModule[] { viewPlugin };
            }

            public override bool ShowDeveloperTools => true;

            public override bool EnableViewPreload => true;

#if DEBUG
            public override bool EnableDebugMode => true;
#endif
        }
    }
}