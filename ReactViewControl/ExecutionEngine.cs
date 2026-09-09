using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using WebViewControl;

namespace ReactViewControl {

    internal class ExecutionEngine : IExecutionEngine {

        internal const string ModulesObjectName = "__Modules__";

        private string id;
        private string frameName;
        private ExtendedWebView webView;

        private ConcurrentQueue<Tuple<IViewModule, string, object[]>> PendingExecutions { get; } = new ConcurrentQueue<Tuple<IViewModule, string, object[]>>();

        private string FormatMethodInvocation(IViewModule module, string methodCall) {
            return ModulesObjectName + "(\"" + frameName + "\",\"" + id + "\",\"" + module.Name + "\")." + methodCall;
        }

        public void ExecuteMethod(IViewModule module, string methodCall, params object[] args) {
            module.Host?.HandledBeforeExecuteMethod();

            if (webView != null) {
                var method = FormatMethodInvocation(module, methodCall);
                webView.ExecuteScriptFunctionWithSerializedParams(method, args);
            } else {
                PendingExecutions.Enqueue(Tuple.Create(module, methodCall, args));
                ReactViewDiagnostics.Log($"Call '{methodCall}' to module '{module.Name}' was buffered: execution engine not started (queued: {PendingExecutions.Count})");
            }
        }

        public T EvaluateMethod<T>(IViewModule module, string methodCall, params object[] args) => EvaluateMethodAsync<T>(module, methodCall, args).Result;

        public Task<T> EvaluateMethodAsync<T>(IViewModule module, string methodCall, params object[] args) {
            if (webView == null) {
                ReactViewDiagnostics.Log($"Evaluate '{methodCall}' on module '{module.Name}' answered with a default value: execution engine not started");
                return Task.FromResult<T>(default);
            }
            module.Host?.HandledBeforeExecuteMethod();
            var method = FormatMethodInvocation(module, methodCall);
            return webView.EvaluateScriptFunctionWithSerializedParams<T>(method, args);
        }

        public void Start(ExtendedWebView webView, string frameName, string id) {
            if (!PendingExecutions.IsEmpty) {
                ReactViewDiagnostics.Log($"Execution engine started for '{frameName}': flushing {PendingExecutions.Count} buffered call(s)");
            }
            this.id = id;
            this.frameName = frameName;
            this.webView = webView;
            while (true) {
                if (PendingExecutions.TryDequeue(out var pendingScript)) {
                    var method = FormatMethodInvocation(pendingScript.Item1, pendingScript.Item2);
                    webView.ExecuteScriptFunctionWithSerializedParams(method, pendingScript.Item3);
                } else {
                    // nothing else to execute
                    break;
                }
            }
        }

        public void MergeWorkload(IExecutionEngine executionEngine) {
            if (this != executionEngine && executionEngine is ExecutionEngine otherEngine) {
                var pendingExecutions = otherEngine.PendingExecutions.ToArray();
                foreach (var execution in pendingExecutions) {
                    PendingExecutions.Enqueue(execution);
                }
            }
        }
    }
}