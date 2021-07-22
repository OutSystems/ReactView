using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Input;
using Avalonia.LogicalTree;
using Avalonia.Platform;

namespace ReactViewControl {

    partial class ReactViewRender : Control {

        partial void ExtraInitialize() {
            VisualChildren.Add(WebView);
        }

        private IEnumerable<Screen> GetScreens() {
            if (Application.Current.ApplicationLifetime is IClassicDesktopStyleApplicationLifetime lifetime) {
                return lifetime.Windows.FirstOrDefault(w => w.Screens?.All.Count > 0)?.Screens.All.ToArray();
            }
            return Host?.FindLogicalAncestorOfType<WindowBase>().Screens?.All;
        }

        partial void PreloadWebView() {
            var initialBrowserSizeWidth = 2000;
            var initialBrowserSizeHeight = 2000;

            var screens = GetScreens();
            if (screens?.Any() == true) {
                // initialize browser with full screen size to avoid html measure issues on initial render
                initialBrowserSizeWidth = (int) screens.Max(s => s.WorkingArea.Width * (ExtendedWebView.Settings.OsrEnabled ? 1 : s.PixelDensity));
                initialBrowserSizeHeight = (int) screens.Max(s => s.WorkingArea.Height * (ExtendedWebView.Settings.OsrEnabled ? 1 : s.PixelDensity));
            }

            WebView.InitializeBrowser(initialBrowserSizeWidth, initialBrowserSizeHeight);
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

        private static bool IsFrameworkAssemblyName(string name) {
            return name.StartsWith("Avalonia") || name == "mscorlib";
        }
    }
}
