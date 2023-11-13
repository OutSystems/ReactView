using ReactViewControl;

namespace Tests.ReactView; 

public class AliasedModule : ViewModuleContainer {

    internal interface IProperties {
    }

    private class Properties : IProperties {
        protected AliasedModule Owner { get; }
        public Properties(AliasedModule owner) {
            Owner = owner;
        }
    }

    protected override string MainJsSource => "/Tests.ReactView/Generated/AliasedModule.js";
    protected override string NativeObjectName => nameof(AliasedModule);
    protected override string ModuleName => "AliasedModule";
    protected override object CreateNativeObject() {
        return new Properties(this);
    }
}
