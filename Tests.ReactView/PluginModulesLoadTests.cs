using System.Threading.Tasks;
using NUnit.Framework;
using ReactViewControl;

namespace Tests.ReactView {

    public class PluginModulesLoadTests : ReactViewTestBase {

        private class ViewFactoryWithPlugin : TestReactViewFactory {

            public override IViewModule[] InitializePlugins() {
                return new IViewModule[] { new PluginModule(), new AliasedModule() };
            }
        }

        private class ReactViewWithPlugin : TestReactView {

            public ReactViewWithPlugin() { }

            protected override ReactViewFactory Factory => new ViewFactoryWithPlugin();
        }

        protected override TestReactView CreateView() {
            return new ReactViewWithPlugin();
        }

        [Test(Description = "Tests plugin module is loaded")]
        public async Task PluginModuleIsLoaded() {
            await Run(async () => {
                var taskCompletionSource = new TaskCompletionSource<string>();

                TargetView.Event += (args) => taskCompletionSource.SetResult(args);
                TargetView.ExecuteMethod("checkPluginModuleLoaded");
                var eventArg = await taskCompletionSource.Task;

                Assert.AreEqual("PluginModuleLoaded", eventArg, "Plugin module was not loaded!");
            });
        }

        [Test(Description = "Tests plugin module is loaded with expected arguments")]
        public async Task PluginModuleReceivesExpectedArguments() {
            await Run(async () => {
                var result = await TargetView.EvaluateMethod<bool[]>("checkPluginInContext");

                CollectionAssert.AreEquivalent(new[] { true, true, true }, result);
            });
        }

        [Test(Description = "Tests module with alias is loaded")]
        public async Task AliasedModuleIsLoaded() {
            await Run(async () => {
                var taskCompletionSource = new TaskCompletionSource<string>();

                TargetView.Event += (args) => taskCompletionSource.SetResult(args);
                TargetView.ExecuteMethod("checkAliasedModuleLoaded");
                var eventArg = await taskCompletionSource.Task;

                Assert.AreEqual("AliasedModuleLoaded", eventArg, "Aliased module was not loaded!");
            });
        }
    }
}
