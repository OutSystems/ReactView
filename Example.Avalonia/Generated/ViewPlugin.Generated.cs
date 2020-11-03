/*** Auto-generated ***/

namespace Example.Avalonia {

    using BaseModule = ReactViewControl.ViewModuleContainer;

    public delegate void ViewPluginNotifyViewLoadedEventHandler(string viewName);

    

    public partial interface IViewPlugin {
        event ViewPluginNotifyViewLoadedEventHandler NotifyViewLoaded;
        void Test();
    }
    
    public partial interface IViewPlugin {}

    public partial class ViewPlugin : BaseModule, IViewPlugin {
        
        internal interface IProperties {
            void NotifyViewLoaded(string viewName);
        }
        
        private class Properties : IProperties {
            protected ViewPlugin Owner { get; }
            public Properties(ViewPlugin owner) => Owner = owner;
            public void NotifyViewLoaded(string viewName) => Owner.NotifyViewLoaded?.Invoke(viewName);
            
        }
        
        public event ViewPluginNotifyViewLoadedEventHandler NotifyViewLoaded;
        public void Test() => ExecutionEngine.ExecuteMethod(this, "test");
        
        protected override string MainJsSource => "/Example.Avalonia/Generated/ViewPlugin.js";
        protected override string NativeObjectName => "ViewPlugin";
        protected override string ModuleName => "ViewPlugin";
        protected override object CreateNativeObject() => new Properties(this);
        protected override string[] Events => new string[] { "notifyViewLoaded" };
        protected override System.Collections.Generic.KeyValuePair<string, object>[] PropertiesValues {
            get { 
                return new System.Collections.Generic.KeyValuePair<string, object>[] {
        
                };
            }
        }
        #if DEBUG
        protected override string Source => "C:/git/ReactView/Example.Avalonia/Generated/ViewPlugin.js";
        #endif
    }
    
    

}