using System;
using System.Threading.Tasks;
using NUnit.Framework;

namespace Tests.ReactView {

    public class InnerViewTests : ReactViewTestBase {

        protected override void InitializeView() {
            if (TargetView != null) {
                TargetView.AutoShowInnerView = true;
            }
            base.InitializeView();
        }

        [Test(Description = "Tests inner view load")]
        public async Task InnerViewIsLoaded() {
            await Run(async () => {
                var taskCompletionSource = new TaskCompletionSource<bool>();

                TargetView.InnerView.Loaded += () => taskCompletionSource.TrySetResult(true);
#if DEBUG
                TargetView.Ready += () => TargetView.InnerView.Load();
#endif
                TargetView.InnerView.Load();

                var isLoaded = await taskCompletionSource.Task;

                Assert.IsTrue(isLoaded, "Inner view module was not loaded!");
            });
        }

        [Test(Description = "Tests inner view reload when web view is reloaded")]
        public async Task InnerViewIsReloadedWhenWebviewIsReloaded() {
            await Run(async () => {
                // Load view for the first time
                var taskCompletionSource = new TaskCompletionSource<bool>();
                TargetView.InnerView.Loaded += () => {
                    taskCompletionSource.TrySetResult(true);
                };

                TargetView.InnerView.Load();
                await taskCompletionSource.Task;

                // Reload view
                taskCompletionSource = new TaskCompletionSource<bool>();
                TargetView.ExecuteMethod("reload");
                var isReloaded = await taskCompletionSource.Task;

                Assert.IsTrue(isReloaded, "Inner view module was not reloaded!");
            });
        }

        [Test(Description = "Tests inner view is collected when destroyed")]
        public async Task InnerViewIsCollectedWhenDestroyed() {
            await Run(async () => {
                var weakRef = new WeakReference(TargetView.InnerView);

                // Load view for the first time
                var taskCompletionSource = new TaskCompletionSource<bool>();
                TargetView.InnerView.Loaded += () => {
                    taskCompletionSource.TrySetResult(true);
                };

                TargetView.InnerView.Load();
                await taskCompletionSource.Task;

                // Reload view
                var targetViewCompletionSource = new TaskCompletionSource<bool>();
                TargetView.ExecuteMethod("setShouldRenderInnerView", false);
                TargetView.ExecuteMethod("reload");

                TargetView.Event += (string name) => {
                    if (name == "NoInnerView") {
                        targetViewCompletionSource.SetResult(true);
                    }
                };

                await targetViewCompletionSource.Task;
                GC.Collect();

                Assert.IsFalse(weakRef.IsAlive, "Inner view was not collected!");
            });
        }

        [Test(Description = "Tests inner view frame loaded event is called")]
        public async Task InnerViewIsViewFrameLoadedEventCalled() {
            await Run(async () => {
                var taskCompletionSource = new TaskCompletionSource<bool>();
#if DEBUG
                TargetView.Ready += () => TargetView.InnerView.Load();
#endif
                TargetView.InnerView.Load();

                TargetView.Event += (name) => {
                    if (name == "InnerViewLoaded") {
                        taskCompletionSource.TrySetResult(true);
                    }
                };
                TargetView.ExecuteMethod("checkInnerViewLoaded");

                var hasLoaded = await taskCompletionSource.Task;
                Assert.IsTrue(hasLoaded, "Inner view javascript event was not called!");
            });
        }

        [Test(Description = "Tests inner view method call")]
        public async Task InnerViewMethodIsExecuted() {
            await Run(async () => {
                var taskCompletionSource = new TaskCompletionSource<bool>();
                var innerView = TargetView.InnerView;

                innerView.MethodCalled += _ => taskCompletionSource.TrySetResult(true);
#if DEBUG
                TargetView.Ready += () => innerView.Load();
#endif
                innerView.Load();
                innerView.TestMethod();
                var methodCalled = await taskCompletionSource.Task;

                Assert.IsTrue(methodCalled, "Method was not called!");
            });
        }

        [Test(Description = "Tests that the view shared context is propagated to inner views")]
        public async Task InnerViewSharedContextIsAvailable() {
            await Run(async () => {
                var taskCompletionSource = new TaskCompletionSource<bool>();
                var innerView = TargetView.InnerView;

                innerView.MethodCalled += (contextLoaded) => taskCompletionSource.TrySetResult(contextLoaded);
#if DEBUG
                TargetView.Ready += () => innerView.Load();
#endif
                innerView.Load();
                innerView.TestMethod();
                var contextLoaded = await taskCompletionSource.Task;

                Assert.IsTrue(contextLoaded, "Context was not loaded");
            });
        }
    }
}
