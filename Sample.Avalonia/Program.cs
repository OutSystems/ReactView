using Avalonia;

namespace Sample.Avalonia {
    class Program {
        static void Main(string[] args) {
            AppBuilder.Configure<App>()
                      .UsePlatformDetect()
                      .StartWithClassicDesktopLifetime(args);
        }
    }
}
