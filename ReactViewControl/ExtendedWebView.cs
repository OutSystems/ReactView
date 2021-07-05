using System.Threading.Tasks;
using WebViewControl;

namespace ReactViewControl {

    internal class ExtendedWebView : WebView {

        public ExtendedWebView(bool useSharedDomain) : base(useSharedDomain) { }

        protected override bool OnSetFocus(bool isSystemEvent) {
            // prevent stealing focus on navigation, only allow when system explicitly sends a focus signal
            return !isSystemEvent ? true : base.OnSetFocus(isSystemEvent);
        }

        public new Task<T> EvaluateScriptFunctionWithSerializedParams<T>(string functionName, params object[] args) {
            return base.EvaluateScriptFunctionWithSerializedParams<T>(functionName, args);
        }

        public new void ExecuteScriptFunctionWithSerializedParams(string functionName, params object[] args) {
            base.ExecuteScriptFunctionWithSerializedParams(functionName, args);
        }
    }
}
