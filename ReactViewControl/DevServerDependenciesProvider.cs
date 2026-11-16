using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;

namespace ReactViewControl {

    /// <summary>
    /// Resolves the scripts and stylesheets of a module from the manifest published by the ReactView dev server,
    /// instead of the .entry files embedded in the assembly. Used when <see cref="ReactViewFactory.DevServerUri"/> is set.
    /// The sources resolve to absolute urls on the dev server, so the webview fetches them (and their hot updates)
    /// straight from it.
    /// </summary>
    internal class DevServerDependenciesProvider : IModuleDependenciesProvider {

        private const string ManifestFileName = "manifest.json";

        private static readonly HttpClient Client = new HttpClient() { Timeout = TimeSpan.FromSeconds(10) };

        private readonly Uri baseUri;
        private readonly string entryName;
        private readonly Lazy<Dictionary<string, List<string>>> manifest;

        /// <param name="devServerUri">Root url of the dev server, e.g. http://localhost:8080/</param>
        /// <param name="sourcePath">Main js source of the module, e.g. /Sample.Avalonia/Generated/MainView.js. Its first segment is the
        /// assembly the dev server serves.</param>
        public DevServerDependenciesProvider(Uri devServerUri, string sourcePath) {
            var segments = sourcePath.Replace("\\", "/").Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length < 2) {
                throw new ArgumentException($"Unexpected module source path '{sourcePath}'", nameof(sourcePath));
            }

            baseUri = new Uri(devServerUri, segments[0] + "/");
            entryName = Path.GetFileNameWithoutExtension(segments[segments.Length - 1]);
            manifest = new Lazy<Dictionary<string, List<string>>>(ReadManifest);
        }

        public string[] GetCssDependencies() => GetDependencies(f => f.EndsWith(".css", StringComparison.OrdinalIgnoreCase));

        public string[] GetJsDependencies() =>
            GetDependencies(f => f.EndsWith(".js", StringComparison.OrdinalIgnoreCase) && !f.EndsWith("/" + entryName + ".js", StringComparison.OrdinalIgnoreCase));

        private string[] GetDependencies(Func<string, bool> filter) {
            if (!manifest.Value.TryGetValue(entryName, out var files)) {
                return Array.Empty<string>();
            }
            return files.Where(filter).Select(f => new Uri(baseUri, f).ToString()).ToArray();
        }

        private Dictionary<string, List<string>> ReadManifest() {
            var manifestUri = new Uri(baseUri, ManifestFileName);
            try {
                var json = Client.GetStringAsync(manifestUri).GetAwaiter().GetResult();
                return JsonSerializer.Deserialize<Dictionary<string, List<string>>>(json) ?? new Dictionary<string, List<string>>();
            } catch (Exception e) {
                throw new InvalidOperationException($"ReactView dev server manifest could not be read from '{manifestUri}'. Is the dev server running? (dotnet msbuild -t:ReactViewDevServer)", e);
            }
        }
    }
}
