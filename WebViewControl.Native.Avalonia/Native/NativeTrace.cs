using System;

namespace WebViewControl.Native {

    /// <summary>
    /// Set the WEBVIEW_NATIVE_TRACE environment variable to 1 to trace the native bridge activity (written to the standard error).
    /// </summary>
    internal static class NativeTrace {

        public static bool Enabled { get; } = Environment.GetEnvironmentVariable("WEBVIEW_NATIVE_TRACE") == "1";

        public static void Write(string message) {
            if (Enabled) {
                Console.Error.WriteLine("[webview-native] " + message);
            }
        }
    }
}
