namespace ReactViewControl;

public interface IViewTransportFactory {

    IViewTransport CreateTransport(IViewTransportHost host);
}
