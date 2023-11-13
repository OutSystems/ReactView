using ReactViewControl;

namespace Tests.ReactView {

    public class TestReactViewFactory : ReactViewFactory {

        public override bool EnableViewPreload => false;
        
        public override IViewModule[] InitializePlugins() {
            return new IViewModule[] { new PluginModule(), new AliasedModule() };
        }
    }
}
