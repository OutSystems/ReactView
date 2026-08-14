using System.Threading.Tasks;
using NUnit.Framework;
using ReactViewControl;

namespace Tests.ReactView {

    public abstract class UnboundNativeObjectCallsTestsBase : ReactViewTestBase {

        /// <summary>
        /// The name the inner view native object is registered under, as built by GetNativeObjectFullName
        /// for the "test" frame.
        /// </summary>
        protected const string InnerViewNativeObjectName = "$test$InnerViewModule";

        protected const string CallReachedNativeObject = "CallReachedNativeObject";

        protected override void InitializeView() {
            if (TargetView != null) {
                TargetView.AutoShowInnerView = true;
            }
            base.InitializeView();
        }

        protected async Task LoadInnerView() {
            var innerViewLoaded = new TaskCompletionSource<bool>();
            TargetView.InnerView.Loaded += () => innerViewLoaded.TrySetResult(true);
#if DEBUG
            TargetView.Ready += () => TargetView.InnerView.Load();
#endif
            TargetView.InnerView.Load();
            await innerViewLoaded.Task;
        }

        /// <summary>
        /// Calls a method of the inner view native object after unbinding it, and returns what came out of
        /// the call: the result reported by the view, or CallReachedNativeObject if the call went through.
        /// </summary>
        protected async Task<string> CallUnboundInnerViewNativeMethod() {
            await LoadInnerView();

            var callResult = new TaskCompletionSource<string>();
            TargetView.Event += result => callResult.TrySetResult(result);
            TargetView.InnerView.MethodCalled += _ => callResult.TrySetResult(CallReachedNativeObject);

            TargetView.ExecuteMethod("callInnerViewNativeMethod", InnerViewNativeObjectName);

            return await callResult.Task;
        }
    }

    public class UnboundNativeObjectCallsTests : UnboundNativeObjectCallsTestsBase {

        [Test(Description = "Tests that a call to a native object that is no longer bound is ignored")]
        public async Task CallToUnboundNativeObjectIsIgnored() {
            await Run(async () => {
                var callResult = await CallUnboundInnerViewNativeMethod();

                Assert.AreEqual("CallCompleted", callResult, "The call to the unbound native object was not ignored!");
            });
        }

        [Test(Description = "Tests that a call to the native object of a destroyed view is ignored")]
        public async Task CallToDestroyedViewNativeObjectIsIgnored() {
            await Run(async () => {
                await LoadInnerView();

                var innerViewHidden = new TaskCompletionSource<bool>();
                var callResult = new TaskCompletionSource<string>();
                TargetView.Event += result => {
                    if (result == "InnerViewHidden") {
                        innerViewHidden.TrySetResult(true);
                    } else {
                        callResult.TrySetResult(result);
                    }
                };
                TargetView.InnerView.MethodCalled += _ => callResult.TrySetResult(CallReachedNativeObject);

                // the notification is sent from the set state callback, which react runs after it has
                // committed the removal, so the inner view is already torn down by the time it arrives
                TargetView.ExecuteMethod("hideInnerView");
                await innerViewHidden.Task;

                TargetView.ExecuteMethod("callInnerViewNativeMethod");

                Assert.AreEqual("CallCompleted", await callResult.Task, "The call to the destroyed view native object was not ignored!");
            });
        }
    }

    public class UnboundNativeObjectCallsWithoutBailOutTests : UnboundNativeObjectCallsTestsBase {

        private class ViewFactoryWithoutBailOut : TestReactViewFactory {

            public override bool BailOutOnUnboundNativeObjectCalls => false;
        }

        private class ReactViewWithoutBailOut : TestReactView {

            protected override ReactViewFactory Factory => new ViewFactoryWithoutBailOut();
        }

        protected override TestReactView CreateView() {
            TestReactView.PreloadedCacheEntriesSize = 0; // disable cache during tests
            return new ReactViewWithoutBailOut();
        }

        [Test(Description = "Tests that a call to a native object that is no longer bound fails, and says which method it was, when bailing out is disabled")]
        public async Task CallToUnboundNativeObjectFails() {
            await Run(async () => {
                var callResult = await CallUnboundInnerViewNativeMethod();

                Assert.That(callResult, Does.StartWith("CallFailed"), "The call to the unbound native object did not fail!");
                Assert.That(callResult, Does.Contain("methodCalled"), "The failure does not say which method was called!");
            });
        }
    }
}
