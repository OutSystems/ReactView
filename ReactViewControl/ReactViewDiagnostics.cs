using System;

namespace ReactViewControl {

    /// <summary>
    /// Surfaces view-lifecycle situations that would otherwise fail silently. The library stays
    /// logger-free: hosts subscribe and route the messages into their own logging or telemetry.
    /// </summary>
    public static class ReactViewDiagnostics {

        public static event Action<string> Message;

        internal static void Log(string message) => Message?.Invoke(message);
    }
}
