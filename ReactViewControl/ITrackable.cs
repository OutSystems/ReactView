namespace ReactViewControl {
    public interface ITrackable {
        string trackId { get; }

        void Merge(object other);
    }
}
