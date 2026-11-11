using System.Windows;
using System.Windows.Controls;
using WebViewControl;

namespace ReactViewControl {

    partial class ReactViewRender : UserControl {

        partial void ExtraInitialize() {
            Content = Transport.Control;
        }

        public IInputElement FocusableElement => Transport.Control is WebView webView ? webView.FocusableElement : Transport.Control as IInputElement;

        partial void PreloadWebView() {
            // initialize browser with full screen size to avoid html measure issues on initial render
            var width = (int)SystemParameters.FullPrimaryScreenWidth;
            var height = (int)SystemParameters.FullPrimaryScreenHeight;
            Transport.Initialize(width, height);
        }

        private static bool IsFrameworkAssemblyName(string name) {
            return name == "PresentationFramework" || name == "PresentationCore" || name == "mscorlib" || name == "System.Xaml" || name == "WindowsBase";
        }
    }
}
