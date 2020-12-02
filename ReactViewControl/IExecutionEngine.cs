using System.Threading.Tasks;

namespace ReactViewControl {

    public interface IExecutionEngine {
        Task<T> EvaluateMethod<T>(IViewModule module, string functionName, params object[] args);
        void ExecuteMethod(IViewModule module, string functionName, params object[] args);
        void MergeWorkload(IExecutionEngine executionEngine);
    }
}
