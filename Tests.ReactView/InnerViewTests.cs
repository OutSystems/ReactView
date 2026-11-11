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

        [Test(Description = "Tests inner view load when web view is reloaded")]
        public async Task InnerViewIsLoadedWhenWebviewIsReloaded() {
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

        [Test(Description = "Tests inner view is collected when web view is reloaded")]
        public async Task InnerViewIsCollectedWhenWebviewIsReloaded() {
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
                TargetView.AutoShowInnerView = false;
                TargetView.ExecuteMethod("reload");
                
                TargetView.Event += (string name) => {
                    if (name == "NoInnerView") {
                        targetViewCompletionSource.SetResult(true);
                    }
                };

                await targetViewCompletionSource.Task;

                // Ensure inner view was not collected
                Assert.IsTrue(weakRef.IsAlive, "Inner view was collected!");
                GC.Collect();

                // Ensure inner view was collected
                Assert.IsFalse(weakRef.IsAlive, "Inner view was not collected!");
            });
        }

        [Test(Description = "Tests inner view load when web view is reloaded again before the inner view loads")]
        public async Task InnerViewIsLoadedWhenWebviewIsReloadedTwiceBeforeItLoads() {
            await Run(async () => {
                // the inner view is not looked up again below: that would bind it to a frame before the page asks for it
                var innerView = TargetView.InnerView;
                var innerViewLoaded = new TaskCompletionSource<bool>();
                innerView.Loaded += () => innerViewLoaded.TrySetResult(true);
                innerView.Load();
                await innerViewLoaded.Task;

                // the pages of these reloads don't show the inner view, so the second one releases a context
                // that never loaded it
                TargetView.AutoShowInnerView = false;
                for (var reloads = 0; reloads < 2; reloads++) {
                    var reloaded = new TaskCompletionSource<bool>();
                    void OnEvent(string name) {
                        if (name == "NoInnerView") {
                            reloaded.TrySetResult(true);
                        }
                    }
                    TargetView.Event += OnEvent;
                    TargetView.ExecuteMethod("reload");
                    await reloaded.Task;
                    TargetView.Event -= OnEvent;
                }

                innerViewLoaded = new TaskCompletionSource<bool>();
                TargetView.AutoShowInnerView = true;
                TargetView.ExecuteMethod("reload");
                var isLoaded = await innerViewLoaded.Task;

                Assert.IsTrue(isLoaded, "Inner view module was not loaded!");
            });
        }

        [Test(Description = "Tests inner view load when it is shown again after web view is reloaded")]
        public async Task InnerViewIsLoadedWhenShownAgainAfterWebviewIsReloaded() {
            await Run(async () => {
                var innerView = TargetView.InnerView;
                var innerViewLoaded = new TaskCompletionSource<bool>();
                innerView.Loaded += () => innerViewLoaded.TrySetResult(true);
                innerView.Load();
                await innerViewLoaded.Task;

                innerViewLoaded = new TaskCompletionSource<bool>();
                TargetView.ExecuteMethod("reload");
                await innerViewLoaded.Task;

                var innerViewHidden = new TaskCompletionSource<bool>();
                TargetView.Event += name => {
                    if (name == "InnerViewHidden") {
                        innerViewHidden.TrySetResult(true);
                    }
                };
                TargetView.ExecuteMethod("hideInnerView");
                await innerViewHidden.Task;

                innerViewLoaded = new TaskCompletionSource<bool>();
                TargetView.ExecuteMethod("showInnerView");
                var isLoaded = await innerViewLoaded.Task;

                Assert.IsTrue(isLoaded, "Inner view module was not loaded again!");
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
