using System;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Http;

namespace ReactViewControl {

    /// <summary>
    /// What the ReactView dev server (dotnet msbuild -t:ReactViewDevServer) serves. A dev server builds one project and
    /// serves its assembly under /&lt;assembly&gt;/; an application made of several view assemblies (plugins, views of
    /// other projects) keeps the others embedded.
    /// </summary>
    internal static class DevServer {

        private const string ManifestFileName = "manifest.json";

        private static readonly HttpClient Client = new HttpClient() { Timeout = TimeSpan.FromSeconds(10) };
        private static readonly ConcurrentDictionary<string, bool> Served = new ConcurrentDictionary<string, bool>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Whether the dev server builds the assembly: it publishes a manifest for it. Asked once per assembly.
        /// When the dev server does not answer, nothing is served from it and the application runs from the embedded
        /// resources (the problem is reported on the standard error).
        /// </summary>
        public static bool Serves(Uri devServerUri, string assemblyName) {
            if (string.IsNullOrEmpty(assemblyName)) {
                return false;
            }
            return Served.GetOrAdd(devServerUri + "|" + assemblyName, _ => Probe(devServerUri, assemblyName));
        }

        /// <summary>
        /// First segment of a resource path, e.g. Sample.Avalonia for /Sample.Avalonia/Generated/MainView.js
        /// </summary>
        public static string AssemblyOf(string resourcePath) {
            var segments = (resourcePath ?? "").Replace("\\", "/").Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            return segments.Length > 0 ? segments[0] : null;
        }

        public static Uri ManifestUri(Uri devServerUri, string assemblyName) => new Uri(devServerUri, assemblyName + "/" + ManifestFileName);

        private static bool Probe(Uri devServerUri, string assemblyName) {
            var manifestUri = ManifestUri(devServerUri, assemblyName);
            try {
                using (var response = Client.GetAsync(manifestUri).GetAwaiter().GetResult()) {
                    if (response.StatusCode == HttpStatusCode.NotFound) {
                        return false;
                    }
                    response.EnsureSuccessStatusCode();
                    return true;
                }
            } catch (Exception e) {
                Console.Error.WriteLine($"[ReactView] The dev server did not answer at '{manifestUri}', the views of {assemblyName} are loaded from the embedded resources. Is the dev server running? (dotnet msbuild -t:ReactViewDevServer) {e.Message}");
                return false;
            }
        }
    }
}
