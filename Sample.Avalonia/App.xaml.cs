using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using WebViewControl;

namespace Sample.Avalonia {

    public class App : Application {

        public override void Initialize() {
            AvaloniaXamlLoader.Load(this);
            WebView.Settings.OsrEnabled = false;
        }

        public override void OnFrameworkInitializationCompleted() {
            if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop) {
                desktop.MainWindow = new MainWindow();
            }
            base.OnFrameworkInitializationCompleted();
        }
    }
}
