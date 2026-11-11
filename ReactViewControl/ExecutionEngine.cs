using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace ReactViewControl {

    internal class ExecutionEngine : IExecutionEngine {

        internal const string ModulesObjectName = "__Modules__";

        private string id;
        private string frameName;
        private IViewTransport transport;

        private ConcurrentQueue<Tuple<IViewModule, string, object[]>> PendingExecutions { get; } = new ConcurrentQueue<Tuple<IViewModule, string, object[]>>();

        private string FormatMethodInvocation(IViewModule module, string methodCall) {
            return ModulesObjectName + "(\"" + frameName + "\",\"" + id + "\",\"" + module.Name + "\")." + methodCall;
        }

        public void ExecuteMethod(IViewModule module, string methodCall, params object[] args) {
            module.Host?.HandledBeforeExecuteMethod();

            if (transport != null) {
                var method = FormatMethodInvocation(module, methodCall);
                transport.ExecuteScriptFunctionWithSerializedParams(method, args);
            } else {
                PendingExecutions.Enqueue(Tuple.Create(module, methodCall, args));
            }
        }

        public T EvaluateMethod<T>(IViewModule module, string methodCall, params object[] args) => EvaluateMethodAsync<T>(module, methodCall, args).Result;

        public Task<T> EvaluateMethodAsync<T>(IViewModule module, string methodCall, params object[] args) {
            if (transport == null) {
                return Task.FromResult<T>(default);
            }
            module.Host?.HandledBeforeExecuteMethod();
            var method = FormatMethodInvocation(module, methodCall);
            return transport.EvaluateScriptFunctionWithSerializedParams<T>(method, args);
        }

        public void Start(IViewTransport transport, string frameName, string id) {
            this.id = id;
            this.frameName = frameName;
            this.transport = transport;
            while (true) {
                if (PendingExecutions.TryDequeue(out var pendingScript)) {
                    var method = FormatMethodInvocation(pendingScript.Item1, pendingScript.Item2);
                    transport.ExecuteScriptFunctionWithSerializedParams(method, pendingScript.Item3);
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