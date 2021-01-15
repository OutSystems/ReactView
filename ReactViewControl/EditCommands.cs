using WebViewControl;

namespace ReactViewControl {

    public class EditCommands {

        private WebView WebView { get; }

        internal EditCommands(WebView webView) {
            WebView = webView;
        }

        public void Cut() => WebView.EditCommands.Cut();

        public void Copy() => WebView.EditCommands.Copy();

        public void Paste() => WebView.EditCommands.Paste();

        public void SelectAll() => WebView.EditCommands.SelectAll();

        public void Undo() => WebView.EditCommands.Undo();

        public void Redo() => WebView.EditCommands.Redo();

        public void Delete() => WebView.EditCommands.Delete();
    }
}
