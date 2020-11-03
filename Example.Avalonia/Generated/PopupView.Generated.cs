/*** Auto-generated ***/

namespace Example.Avalonia {

    using BaseComponent = Example.Avalonia.ExtendedReactView;
    using BaseModule = ReactViewControl.ViewModuleContainer;

    public delegate void PopupViewLoadedEventHandler();

    

    public partial interface IPopupViewModule {
        event PopupViewLoadedEventHandler Loaded;
    }
    
    public partial interface IPopupView : IPopupViewModule {}

    public partial class PopupViewModule : BaseModule, IPopupViewModule {
        
        internal interface IProperties {
            void Loaded();
        }
        
        private class Properties : IProperties {
            protected PopupViewModule Owner { get; }
            public Properties(PopupViewModule owner) => Owner = owner;
            public void Loaded() => Owner.Loaded?.Invoke();
            
        }
        
        public event PopupViewLoadedEventHandler Loaded;
        
        protected override string MainJsSource => "/Example.Avalonia/Generated/PopupView.js";
        protected override string NativeObjectName => "PopupView";
        protected override string ModuleName => "PopupView";
        protected override object CreateNativeObject() => new Properties(this);
        protected override string[] Events => new string[] { "loaded" };
        protected override System.Collections.Generic.KeyValuePair<string, object>[] PropertiesValues {
            get { 
                return new System.Collections.Generic.KeyValuePair<string, object>[] {
        
                };
            }
        }
        #if DEBUG
        protected override string Source => "C:/git/ReactView/Example.Avalonia/Generated/PopupView.js";
        #endif
    }
    
    public partial class PopupView : BaseComponent, IPopupViewModule {
    
        public PopupView() : base(new PopupViewModule()) {
            InitializePopupView();
        }
    
        partial void InitializePopupView();
    
        protected new PopupViewModule MainModule => (PopupViewModule) base.MainModule;
    
        public event PopupViewLoadedEventHandler Loaded {
            add => MainModule.Loaded += value;
            remove => MainModule.Loaded -= value;
        }
    }

    partial class PopupViewAdapter : IPopupView {
    
        public event PopupViewLoadedEventHandler Loaded {
            add => Component.Loaded += value;
            remove => Component.Loaded -= value;
        }
    }
    

}