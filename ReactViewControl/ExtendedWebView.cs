using WebViewControl;

namespace ReactViewControl {

    internal class ExtendedWebView : WebView {

        public ExtendedWebView(bool useSharedDomain) : base(useSharedDomain) { }

        protected override bool OnSetFocus(bool isSystemEvent) {
            // prevent stealing focus on navigation, only allow when system explicitly sends a focus signal
            return isSystemEvent ? false : true;
        }
    }
}
