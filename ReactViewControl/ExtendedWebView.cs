using System;
using WebViewControl;

namespace ReactViewControl {

    internal class ExtendedWebView : WebView {

        public event Action GotWebViewFocus;
        public event Action LostWebViewFocus;

        public ExtendedWebView(bool useSharedDomain) : base(useSharedDomain) { }

        protected override bool OnSetFocus(bool isSystemEvent) {
            // prevent stealing focus on navigation, only allow when system explicitly sends a focus signal
            return !isSystemEvent;
        }

        protected override void OnGotFocus() {
            GotWebViewFocus?.Invoke();
            base.OnGotFocus();
        }

        protected override void OnLostFocus() {
            LostWebViewFocus?.Invoke();
            base.OnLostFocus();
        }
    }
}
