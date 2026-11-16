using System;
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

            public override bool ShowDeveloperTools => false;

            public override bool EnableViewPreload => true;

#if DEBUG
            public override bool EnableDebugMode => true;

            // hot reload: run "dotnet msbuild Sample.Avalonia.csproj -t:ReactViewDevServer" and start the app with
            // DEV_SERVER_URI=http://localhost:8080
            public override Uri DevServerUri =>
                Uri.TryCreate(Environment.GetEnvironmentVariable("DEV_SERVER_URI"), UriKind.Absolute, out var uri) ? uri : null;

            // DevTools protocol for tooling while developing against the dev server
            public override int RemoteDebuggingPort => DevServerUri != null ? 9222 : 0;
#endif
        }
    }
}