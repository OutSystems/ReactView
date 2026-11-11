namespace ReactViewControl;

public sealed class ViewTransportFactory : IViewTransportFactory {

    public static IViewTransportFactory Instance { get; set; } = new ViewTransportFactory();

    public IViewTransport CreateTransport(IViewTransportHost host) {
        return new CefViewTransport(host);
    }
}
