using System.Threading.Tasks;

namespace ReactViewControl {

    public interface IExecutionEngine {
        T EvaluateMethod<T>(IViewModule module, string functionName, params object[] args);
        Task<T> EvaluateMethodAsync<T>(IViewModule module, string functionName, params object[] args);
        void ExecuteMethod(IViewModule module, string functionName, params object[] args);
        void MergeWorkload(IExecutionEngine executionEngine);
    }
}
