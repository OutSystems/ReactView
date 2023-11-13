using ReactViewControl;

namespace Tests.ReactView; 

public class PluginModule : ViewModuleContainer {

    internal interface IProperties {
    }

    private class Properties : IProperties {
        protected PluginModule Owner { get; }
        public Properties(PluginModule owner) {
            Owner = owner;
        }
    }

    protected override string MainJsSource => "/Tests.ReactView/Generated/PluginModule.js";
    protected override string NativeObjectName => nameof(PluginModule);
    protected override string ModuleName => "PluginModule";
    protected override object CreateNativeObject() {
        return new Properties(this);
    }
}
