using Avalonia;

namespace Sample.Avalonia {
    class Program {
        static void Main(string[] args) {
            AppBuilder.Configure<App>()
                      .UsePlatformDetect()
                      .UsePlatformDetect()
                      .With(new Win32PlatformOptions { UseWindowsUIComposition = false })
                      .StartWithClassicDesktopLifetime(args);
        }
    }
}
