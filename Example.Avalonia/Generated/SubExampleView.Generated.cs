/*** Auto-generated ***/

namespace Example.Avalonia {

    using BaseComponent = Example.Avalonia.ExtendedReactView;
    using BaseModule = ReactViewControl.ViewModuleContainer;

    public delegate void SubExampleViewClickEventHandler();
    public delegate string SubExampleViewGetTimeEventHandler();

    

    public partial interface ISubExampleViewModule {
        event SubExampleViewClickEventHandler Click;
        event SubExampleViewGetTimeEventHandler GetTime;
        string ConstantMessage { get; set; }
        void CallMe();
    }
    
    public partial interface ISubExampleView : ISubExampleViewModule {}

    public partial class SubExampleViewModule : BaseModule, ISubExampleViewModule {
        
        internal interface IProperties {
            void Click();
            string GetTime();
        }
        
        private class Properties : IProperties {
            protected SubExampleViewModule Owner { get; }
            public Properties(SubExampleViewModule owner) => Owner = owner;
            public void Click() => Owner.Click?.Invoke();
            
            public string GetTime() => Owner.GetTime?.Invoke() ?? default(string);
            
        }
        
        public event SubExampleViewClickEventHandler Click;
        public event SubExampleViewGetTimeEventHandler GetTime;
        public string ConstantMessage { get; set; }
        public void CallMe() => ExecutionEngine.ExecuteMethod(this, "callMe");
        
        protected override string MainJsSource => "/Example.Avalonia/Generated/SubExampleView.js";
        protected override string NativeObjectName => "SubExampleView";
        protected override string ModuleName => "SubExampleView";
        protected override object CreateNativeObject() => new Properties(this);
        protected override string[] Events => new string[] { "click","getTime" };
        protected override System.Collections.Generic.KeyValuePair<string, object>[] PropertiesValues {
            get { 
                return new System.Collections.Generic.KeyValuePair<string, object>[] {
                    new System.Collections.Generic.KeyValuePair<string, object>("constantMessage", ConstantMessage)
                };
            }
        }
        #if DEBUG
        protected override string Source => "C:/git/ReactView/Example.Avalonia/Generated/SubExampleView.js";
        #endif
    }
    
    public partial class SubExampleView : BaseComponent, ISubExampleViewModule {
    
        public SubExampleView() : base(new SubExampleViewModule()) {
            InitializeSubExampleView();
        }
    
        partial void InitializeSubExampleView();
    
        protected new SubExampleViewModule MainModule => (SubExampleViewModule) base.MainModule;
    
        public event SubExampleViewClickEventHandler Click {
            add => MainModule.Click += value;
            remove => MainModule.Click -= value;
        }
        public event SubExampleViewGetTimeEventHandler GetTime {
            add => MainModule.GetTime += value;
            remove => MainModule.GetTime -= value;
        }
        public string ConstantMessage {
            get => MainModule.ConstantMessage;
            set => MainModule.ConstantMessage = value;
        }
        public void CallMe() => MainModule.CallMe();
        
    }

    partial class SubExampleViewAdapter : ISubExampleView {
    
        public event SubExampleViewClickEventHandler Click {
            add => Component.Click += value;
            remove => Component.Click -= value;
        }
        public event SubExampleViewGetTimeEventHandler GetTime {
            add => Component.GetTime += value;
            remove => Component.GetTime -= value;
        }
        public string ConstantMessage {
            get => Component.ConstantMessage;
            set => Component.ConstantMessage = value;
        }
        public void CallMe() => Component.CallMe();
        
    }
    

}