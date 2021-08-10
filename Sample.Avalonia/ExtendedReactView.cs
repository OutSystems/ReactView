using ReactViewControl;

namespace Sample.Avalonia {

    public abstract class ExtendedReactView : ReactView {

        protected override ReactViewFactory Factory => new ExtendedReactViewFactory();

        public ExtendedReactView(IViewModule mainModule) : base(mainModule) {
            Settings.ThemeChanged += OnStylePreferenceChanged;
        }

        protected override void InnerDispose() {
            base.InnerDispose();
            Settings.ThemeChanged -= OnStylePreferenceChanged;
        }

        private void OnStylePreferenceChanged() {
            RefreshDefaultStyleSheet();
        }
    }
}
