/*** Auto-generated ***/

namespace Example.Avalonia {

    using BaseComponent = Example.Avalonia.ExtendedReactView;
    using BaseModule = ReactViewControl.ViewModuleContainer;

    public delegate void ExampleViewClickEventHandler(SomeType arg);
    public delegate string ExampleViewGetTimeEventHandler();
    public delegate void ExampleViewViewMountedEventHandler();
    public delegate void ExampleViewInputChangedEventHandler();

    public struct SomeType {
        public string name { get; set; }
    }
    
    public enum ImageKind {
        None,
        Beach
    }

    public partial interface IExampleViewModule {
        event ExampleViewClickEventHandler Click;
        event ExampleViewGetTimeEventHandler GetTime;
        event ExampleViewViewMountedEventHandler ViewMounted;
        event ExampleViewInputChangedEventHandler InputChanged;
        string ConstantMessage { get; set; }
        ImageKind Image { get; set; }
        void CallMe();
        ISubExampleViewModule SubView { get; }
        
    }
    
    public partial interface IExampleView : IExampleViewModule {}

    public partial class ExampleViewModule : BaseModule, IExampleViewModule {
        
        internal interface IProperties {
            void Click(SomeType arg);
            string GetTime();
            void ViewMounted();
            void InputChanged();
        }
        
        private class Properties : IProperties {
            protected ExampleViewModule Owner { get; }
            public Properties(ExampleViewModule owner) => Owner = owner;
            public void Click(SomeType arg) => Owner.Click?.Invoke(arg);
            
            public string GetTime() => Owner.GetTime?.Invoke() ?? default(string);
            
            public void ViewMounted() => Owner.ViewMounted?.Invoke();
            
            public void InputChanged() => Owner.InputChanged?.Invoke();
            
        }
        
        public event ExampleViewClickEventHandler Click;
        public event ExampleViewGetTimeEventHandler GetTime;
        public event ExampleViewViewMountedEventHandler ViewMounted;
        public event ExampleViewInputChangedEventHandler InputChanged;
        public string ConstantMessage { get; set; }
        public ImageKind Image { get; set; }
        public void CallMe() => ExecutionEngine.ExecuteMethod(this, "callMe");
        public ISubExampleViewModule SubView { get => GetOrAddChildView<SubExampleViewModule>("SubView"); }
        
        protected override string MainJsSource => "/Example.Avalonia/Generated/ExampleView.js";
        protected override string NativeObjectName => "ExampleView";
        protected override string ModuleName => "ExampleView";
        protected override object CreateNativeObject() => new Properties(this);
        protected override string[] Events => new string[] { "click","getTime","viewMounted","inputChanged" };
        protected override System.Collections.Generic.KeyValuePair<string, object>[] PropertiesValues {
            get { 
                return new System.Collections.Generic.KeyValuePair<string, object>[] {
                    new System.Collections.Generic.KeyValuePair<string, object>("constantMessage", ConstantMessage),
                    new System.Collections.Generic.KeyValuePair<string, object>("image", Image)
                };
            }
        }
        #if DEBUG
        protected override string Source => "C:/git/ReactView/Example.Avalonia/Generated/ExampleView.js";
        #endif
    }
    
    public partial class ExampleView : BaseComponent, IExampleViewModule {
    
        public ExampleView() : base(new ExampleViewModule()) {
            InitializeExampleView();
        }
    
        partial void InitializeExampleView();
    
        protected new ExampleViewModule MainModule => (ExampleViewModule) base.MainModule;
    
        public event ExampleViewClickEventHandler Click {
            add => MainModule.Click += value;
            remove => MainModule.Click -= value;
        }
        public event ExampleViewGetTimeEventHandler GetTime {
            add => MainModule.GetTime += value;
            remove => MainModule.GetTime -= value;
        }
        public event ExampleViewViewMountedEventHandler ViewMounted {
            add => MainModule.ViewMounted += value;
            remove => MainModule.ViewMounted -= value;
        }
        public event ExampleViewInputChangedEventHandler InputChanged {
            add => MainModule.InputChanged += value;
            remove => MainModule.InputChanged -= value;
        }
        public string ConstantMessage {
            get => MainModule.ConstantMessage;
            set => MainModule.ConstantMessage = value;
        }
        public ImageKind Image {
            get => MainModule.Image;
            set => MainModule.Image = value;
        }
        public void CallMe() => MainModule.CallMe();
        
        public ISubExampleViewModule SubView => MainModule.SubView;
        
    }

    partial class ExampleViewAdapter : IExampleView {
    
        public event ExampleViewClickEventHandler Click {
            add => Component.Click += value;
            remove => Component.Click -= value;
        }
        public event ExampleViewGetTimeEventHandler GetTime {
            add => Component.GetTime += value;
            remove => Component.GetTime -= value;
        }
        public event ExampleViewViewMountedEventHandler ViewMounted {
            add => Component.ViewMounted += value;
            remove => Component.ViewMounted -= value;
        }
        public event ExampleViewInputChangedEventHandler InputChanged {
            add => Component.InputChanged += value;
            remove => Component.InputChanged -= value;
        }
        public string ConstantMessage {
            get => Component.ConstantMessage;
            set => Component.ConstantMessage = value;
        }
        public ImageKind Image {
            get => Component.Image;
            set => Component.Image = value;
        }
        public void CallMe() => Component.CallMe();
        
        public ISubExampleViewModule SubView => Component.SubView;
        
    }
    

}