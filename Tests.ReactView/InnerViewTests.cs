﻿using System.Threading.Tasks;
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

                innerView.MethodCalled += () => taskCompletionSource.TrySetResult(true);
#if DEBUG
                TargetView.Ready += () => innerView.Load();
#endif
                innerView.Load();
                innerView.TestMethod();
                var methodCalled = await taskCompletionSource.Task;

                Assert.IsTrue(methodCalled, "Method was not called!");
            });
        }
    }
}
