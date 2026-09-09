using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;
using ReactViewControl;

namespace Tests.ReactView {

    // Plain fixture on purpose: the stopped-engine behavior needs no browser.
    public class ExecutionEngineDiagnosticsTests {

        private class FakeModule : ViewModuleContainer {
            protected override string ModuleName => "FakeModule";
        }

        private class Unsubscriber : IDisposable {
            private readonly Action dispose;
            public Unsubscriber(Action dispose) => this.dispose = dispose;
            public void Dispose() => dispose();
        }

        private static IDisposable CaptureDiagnostics(List<string> sink) {
            void OnMessage(string message) => sink.Add(message);
            ReactViewDiagnostics.Message += OnMessage;
            return new Unsubscriber(() => ReactViewDiagnostics.Message -= OnMessage);
        }

        [Test(Description = "A call executed before the engine starts is buffered and reported, not lost silently")]
        public void CallOnStoppedEngineIsBufferedAndReported() {
            var messages = new List<string>();
            using (CaptureDiagnostics(messages)) {
                var engine = new ExecutionEngine();
                IViewModule module = new FakeModule();

                engine.ExecuteMethod(module, "refreshInnerPanes");

                Assert.That(messages, Has.Some.Contains("buffered"), "buffering must be surfaced through diagnostics");
                Assert.That(messages, Has.Some.Contains("refreshInnerPanes"), "the diagnostic must name the buffered call");
            }
        }

        [Test(Description = "An evaluation on a stopped engine answers default and is reported, not silent")]
        public async Task EvaluateOnStoppedEngineAnswersDefaultAndReports() {
            var messages = new List<string>();
            using (CaptureDiagnostics(messages)) {
                var engine = new ExecutionEngine();
                IViewModule module = new FakeModule();

                var result = await engine.EvaluateMethodAsync<int>(module, "getBottomPaneInfo");

                Assert.AreEqual(0, result, "a stopped engine answers default(T)");
                Assert.That(messages, Has.Some.Contains("default value"), "the default answer must be surfaced through diagnostics");
            }
        }
    }
}
