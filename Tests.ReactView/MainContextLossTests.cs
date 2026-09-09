using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using NUnit.Framework;
using ReactViewControl;

namespace Tests.ReactView {

    // Regression coverage for the superseded-main-context defect (RDPIM-4385): a main context release
    // used to run the document-gone cleanup immediately, stranding every live inner view. The cleanup
    // is now deferred until a new main view initializes.
    public class MainContextLossTests : ReactViewTestBase {

        // Fires the real (private) release handler; a stray release cannot be produced on demand otherwise.
        private static void SimulateMainContextReleased(ReactViewControl.ReactView view) {
            var render = typeof(ReactViewControl.ReactView)
                .GetProperty("View", BindingFlags.Instance | BindingFlags.NonPublic)!
                .GetValue(view)!;
            render.GetType()
                .GetMethod("OnWebViewJavascriptContextReleased", BindingFlags.Instance | BindingFlags.NonPublic)!
                .Invoke(render, new object[] { FrameInfo.MainViewFrameName });
        }

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

        [Test(Description = "A stray main-context release must not break the inner view: calls still arrive")]
        public async Task InnerViewSurvivesStrayMainContextRelease() {
            await Run(async () => {
                var loaded = new TaskCompletionSource<bool>();
                TargetView.InnerView.Loaded += () => loaded.TrySetResult(true);
                TargetView.InnerView.Load();
                await loaded.Task;

                SimulateMainContextReleased(TargetView);

                var methodCalled = new TaskCompletionSource<bool>();
                TargetView.InnerView.MethodCalled += _ => methodCalled.TrySetResult(true);
                TargetView.InnerView.TestMethod();

                var completed = await Task.WhenAny(methodCalled.Task, Task.Delay(TimeSpan.FromSeconds(10)));
                Assert.AreSame(methodCalled.Task, completed, "inner view stopped answering after a stray main-context release");
                Assert.IsFalse(diagnostics.Any(m => m.Contains("buffered")), "no call may be buffered on a stopped engine after a stray release");
            });
        }

        [Test(Description = "A reload after a main-context release runs the deferred cleanup and comes back functional")]
        public async Task ReloadAfterMainContextReleaseCleansStaleFrames() {
            await Run(async () => {
                var loaded = new TaskCompletionSource<bool>();
                TargetView.InnerView.Loaded += () => loaded.TrySetResult(true);
                TargetView.InnerView.Load();
                await loaded.Task;

                SimulateMainContextReleased(TargetView);

                var reloaded = new TaskCompletionSource<bool>();
                TargetView.InnerView.Loaded += () => reloaded.TrySetResult(true);
                TargetView.ExecuteMethod("reload");
                await reloaded.Task;

                Assert.IsTrue(diagnostics.Any(m => m.Contains("stale frame")), "the deferred cleanup must run when the new main view initializes");

                var methodCalled = new TaskCompletionSource<bool>();
                TargetView.InnerView.MethodCalled += _ => methodCalled.TrySetResult(true);
                TargetView.InnerView.TestMethod();
                var completed = await Task.WhenAny(methodCalled.Task, Task.Delay(TimeSpan.FromSeconds(10)));
                Assert.AreSame(methodCalled.Task, completed, "inner view must be functional after the reload");
            });
        }
    }
}
