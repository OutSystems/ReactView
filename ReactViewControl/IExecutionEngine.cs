using System.Collections.Generic;

namespace ReactViewControl {

    public interface IExecutionEngine {
        T EvaluateMethod<T>(IViewModule module, string functionName, params object[] args);
        void ExecuteMethod(IViewModule module, string functionName, params object[] args);

        TrackableType TrackObject<TrackableType>(TrackableType obj) where TrackableType : ITrackable;

        TrackableType[] TrackObject<TrackableType>(TrackableType[] objs) where TrackableType : ITrackable;

        ConcreteType GetTrackedObject<ConcreteType>(ConcreteType trackable) where ConcreteType : ITrackable;
    }
}
