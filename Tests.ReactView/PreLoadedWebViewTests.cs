using System.Threading.Tasks;
using NUnit.Framework;
using ReactViewControl;
using WebViewControl;

namespace Tests.ReactView {

    public class PreLoadedWebViewTests : ReactViewTestBase {

        private class TestReactViewFactoryWithPreload : TestReactViewFactory {
            public override bool EnableViewPreload => true;
        }

        private class TestReactViewWithPreload : TestReactView {

            public TestReactViewWithPreload() {
                AutoShowInnerView = true;
                var innerView = new InnerViewModule();
                innerView.Load();
            }

            protected override ReactViewFactory Factory => new TestReactViewFactoryWithPreload();
        }

        protected override TestReactView CreateView() {
            return new TestReactViewWithPreload();
        }

        [Test(Description = "Loading a view with a inner view and preload enabled loads the component successfully the second time")]
        public async Task PreloadLoadsComponent() {
            await Run(async () => {
                using var newView = new TestReactViewWithPreload();
                newView.Load();

                var ready = await newView.AwaitReady();
                Assert.IsTrue(ready, "Second view was not properly loaded!");
            });
        }

        [Test(Description = "Loading a view with preload enabled uses a webview from cache")]
        public async Task PreloadUsesWebViewFromCache() {
            var webviewInstantiatedTaskCompletionSource = new TaskCompletionSource<bool>();
            void OnWebViewInitialized(WebView webview) {
                webviewInstantiatedTaskCompletionSource.TrySetResult(true);
            }

            try {
                WebView.GlobalWebViewInitialized += OnWebViewInitialized;
                await Run(async () => {
                    using var newView = new TestReactViewWithPreload();
                    newView.Load();
                    var currentTime = await TargetView.EvaluateMethod<double>("getCurrentTime");

                    // wait for the cached webview to be instantiated
                    await webviewInstantiatedTaskCompletionSource.Task;

                    using var newView2 = new TestReactViewWithPreload();
                    newView2.Load();

                    var startTime = await newView2.EvaluateMethod<double>("getStartTime");
                    Assert.LessOrEqual(startTime, currentTime, "The second webview should have been loaded before!");
                });
            } finally {
                WebView.GlobalWebViewInitialized -= OnWebViewInitialized;
            }
        }
    }
}
