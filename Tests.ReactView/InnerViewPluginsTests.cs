using System.Threading.Tasks;
using NUnit.Framework;
using ReactViewControl;

namespace Tests.ReactView {

    public class InnerViewPluginsTests : ReactViewTestBase {

        private class ViewFactoryWithPlugin : TestReactViewFactory {

            public override IViewModule[] InitializePlugins() {
                return new IViewModule[] { new PluginModule() };
            }
        }

        private class ReactViewWithPlugin : TestReactView {

            public ReactViewWithPlugin() { }

            protected override ReactViewFactory Factory => new ViewFactoryWithPlugin();
        }

        protected override TestReactView CreateView() {
            return new ReactViewWithPlugin();
        }

        protected override void InitializeView() {
            if (TargetView != null) {
                TargetView.AutoShowInnerView = true;
            }
            base.InitializeView();
        }

        [Test(Description = "Tests inner view plugins are disposed when the view is destroyed")]
        public async Task PluginIsDisposedWhenInnerViewIsDestroyed() {
            await Run(async () => {
                var innerViewLoaded = new TaskCompletionSource<bool>();
                TargetView.InnerView.Loaded += () => innerViewLoaded.TrySetResult(true);
#if DEBUG
                TargetView.Ready += () => TargetView.InnerView.Load();
#endif
                TargetView.InnerView.Load();
                await innerViewLoaded.Task;

                var innerViewHidden = new TaskCompletionSource<bool>();
                TargetView.Event += name => {
                    if (name == "InnerViewHidden") {
                        innerViewHidden.TrySetResult(true);
                    }
                };
                // the notification is sent from the set state callback, which react runs after it has
                // committed the removal, so the inner view is already torn down by the time it arrives
                TargetView.ExecuteMethod("hideInnerView");
                await innerViewHidden.Task;

                // Plugins are not part of the react tree, so unmounting the view is not enough to release them
                var disposedPlugins = await TargetView.EvaluateMethod<int>("getDisposedPluginModulesCount");

                Assert.AreEqual(1, disposedPlugins, "The plugin of the destroyed view was not disposed!");
            });
        }
    }
}
