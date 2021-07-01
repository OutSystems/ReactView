using System.ComponentModel;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Input;
using Avalonia.LogicalTree;

namespace ReactViewControl {

    partial class ReactViewRender : Control {

        private static Window hiddenWindow;

        private static Window GetHiddenWindow() {
            if (hiddenWindow == null) {
                hiddenWindow = new Window() {
                    IsVisible = false,
                    Focusable = false,
                    Title = "Hidden React View Window"
                };
                hiddenWindow.Closing += OnHiddenWindowClosing;
            }
            return hiddenWindow;
        }

        partial void ExtraInitialize() {
            VisualChildren.Add(WebView);
        }

        partial void PreloadWebView() {
            var window = Host?.FindLogicalAncestorOfType<WindowBase>();

            var initialBrowserSizeWidth = 2000;
            var initialBrowserSizeHeight = 2000;

            var screens = window?.Screens?.All;
            if (screens == null || screens.Count == 0) {
                window = GetHiddenWindow();
                screens = window?.Screens?.All;
            }

            if (screens?.Count > 0) {
                // initialize browser with full screen size to avoid html measure issues on initial render
                initialBrowserSizeWidth = (int) screens.Max(s => s.WorkingArea.Width * (ExtendedWebView.Settings.OsrEnabled ? 1 : s.PixelDensity));
                initialBrowserSizeHeight = (int) screens.Max(s => s.WorkingArea.Height * (ExtendedWebView.Settings.OsrEnabled ? 1 : s.PixelDensity));
            }

            WebView.InitializeBrowser(window, initialBrowserSizeWidth, initialBrowserSizeHeight);
        }

        protected override void OnGotFocus(GotFocusEventArgs e) {
            e.Handled = true;
            WebView.Focus();
        }

        protected override void OnPropertyChanged<T>(AvaloniaPropertyChangedEventArgs<T> change) {
            base.OnPropertyChanged(change);

            if (!ExtendedWebView.Settings.OsrEnabled && change.Property == IsEffectivelyEnabledProperty) {
                 DisableInputInteractions(!IsEffectivelyEnabled);
            }
        }

        private static void OnHiddenWindowClosing(object sender, CancelEventArgs e) {
            e.Cancel |= ((IClassicDesktopStyleApplicationLifetime)Application.Current.ApplicationLifetime).Windows.Count() != 0;
        }

        private static bool IsFrameworkAssemblyName(string name) {
            return name.StartsWith("Avalonia") || name == "mscorlib";
        }
    }
}
