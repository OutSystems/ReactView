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

        /// <summary>
        /// The test app methods that call into the inner view native object: one reaching a method that
        /// returns nothing, the other one a method that returns a value.
        /// </summary>
        protected const string CallVoidNativeMethod = "callInnerViewNativeMethod";

        protected const string CallValueReturningNativeMethod = "callInnerViewNativeValueMethod";

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
        /// Calls a method of the inner view native object after unbinding it, leaving the view itself alive,
        /// and returns what came out of the call: the result reported by the view, or
        /// CallReachedNativeObject if the call went through.
        /// </summary>
        protected async Task<string> CallUnboundInnerViewNativeMethod(string viewMethod = CallVoidNativeMethod) {
            await LoadInnerView();

            var callResult = new TaskCompletionSource<string>();
            TargetView.Event += result => callResult.TrySetResult(result);
            ObserveCallsReachingNativeObject(callResult);

            TargetView.ExecuteMethod(viewMethod, InnerViewNativeObjectName);

            return await callResult.Task;
        }

        /// <summary>
        /// Calls a method of the inner view native object after destroying the view that owns it, and
        /// returns what came out of the call, as CallUnboundInnerViewNativeMethod does.
        /// </summary>
        protected async Task<string> CallDestroyedInnerViewNativeMethod(string viewMethod = CallVoidNativeMethod) {
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
            ObserveCallsReachingNativeObject(callResult);

            // the notification is sent from the set state callback, which react runs after it has
            // committed the removal, so the inner view is already torn down by the time it arrives
            TargetView.ExecuteMethod("hideInnerView");
            await innerViewHidden.Task;

            TargetView.ExecuteMethod(viewMethod);

            return await callResult.Task;
        }

        private void ObserveCallsReachingNativeObject(TaskCompletionSource<string> callResult) {
            TargetView.InnerView.MethodCalled += _ => callResult.TrySetResult(CallReachedNativeObject);
            TargetView.InnerView.ValueReturningMethodCalled += _ => callResult.TrySetResult(CallReachedNativeObject);
        }
    }

    public class UnboundNativeObjectCallsTests : UnboundNativeObjectCallsTestsBase {

        [Test(Description = "Tests that a call to the native object of a destroyed view is ignored")]
        public async Task CallToDestroyedViewNativeObjectIsIgnored() {
            await Run(async () => {
                var callResult = await CallDestroyedInnerViewNativeMethod();

                Assert.AreEqual("CallCompleted", callResult, "The call to the destroyed view native object was not ignored!");
            });
        }

        [Test(Description = "Tests that a value returning call to the native object of a destroyed view is ignored as well: nobody is left to read the result")]
        public async Task ValueReturningCallToDestroyedViewNativeObjectIsIgnored() {
            await Run(async () => {
                var callResult = await CallDestroyedInnerViewNativeMethod(CallValueReturningNativeMethod);

                Assert.AreEqual("CallCompleted", callResult, "The value returning call to the destroyed view native object was not ignored!");
            });
        }

        [Test(Description = "Tests that a call to a native object that is no longer bound, made by a view that is still alive, fails instead of being silently dropped")]
        public async Task CallToUnboundNativeObjectOfLiveViewFails() {
            await Run(async () => {
                var callResult = await CallUnboundInnerViewNativeMethod();

                Assert.That(callResult, Does.StartWith("CallFailed"), "The call of a live view to its unbound native object did not fail!");
                Assert.That(callResult, Does.Contain("methodCalled"), "The failure does not say which method was called!");
            });
        }

        [Test(Description = "Tests that a value returning call to a native object that is no longer bound, made by a view that is still alive, fails and says which method it was")]
        public async Task ValueReturningCallToUnboundNativeObjectOfLiveViewFails() {
            await Run(async () => {
                var callResult = await CallUnboundInnerViewNativeMethod(CallValueReturningNativeMethod);

                Assert.That(callResult, Does.StartWith("CallFailed"), "The value returning call of a live view to its unbound native object did not fail!");
                Assert.That(callResult, Does.Contain("valueReturningMethodCalled"), "The failure does not say which method was called!");
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

        [Test(Description = "Tests that a call to the native object of a destroyed view fails when bailing out is disabled")]
        public async Task CallToDestroyedViewNativeObjectFails() {
            await Run(async () => {
                var callResult = await CallDestroyedInnerViewNativeMethod();

                Assert.That(callResult, Does.StartWith("CallFailed"), "The call to the destroyed view native object did not fail!");
            });
        }
    }
}
