using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using NUnit.Framework;
using ReactViewControl;

namespace Tests.ReactView {

    public class UnloadChildViewTests : ReactViewTestBase {

        private ConcurrentQueue<string> diagnostics;

        protected override void InitializeView() {
            diagnostics = new ConcurrentQueue<string>();
            ReactViewDiagnostics.Message += OnDiagnosticMessage;
            if (TargetView != null) {
                TargetView.AutoShowInnerView = true;
            }
            base.InitializeView();
        }

        [TearDown]
        public void DetachDiagnostics() {
            ReactViewDiagnostics.Message -= OnDiagnosticMessage;
        }

        private void OnDiagnosticMessage(string message) => diagnostics.Enqueue(message);

        [Test(Description = "The host can unload a child view directly, without a react re-render of its owner")]
        public async Task HostInitiatedUnloadReleasesTheChildView() {
            await Run(async () => {
                var loaded = new TaskCompletionSource<bool>();
                TargetView.InnerView.Loaded += () => loaded.TrySetResult(true);
                TargetView.InnerView.Load();
                await loaded.Task;

                TargetView.UnloadChildView("test");

                var deadline = DateTime.UtcNow + TimeSpan.FromSeconds(10);
                while (DateTime.UtcNow < deadline && !diagnostics.Any(m => m.Contains("'test' destroyed"))) {
                    await Task.Delay(100);
                }

                Assert.IsTrue(diagnostics.Any(m => m.Contains("'test' unloaded")), "the native side must be released eagerly");
                Assert.IsTrue(diagnostics.Any(m => m.Contains("'test' destroyed")), "the JS side must tear the view down");
            });
        }
    }
}
