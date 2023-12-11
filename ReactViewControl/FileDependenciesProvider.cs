using System;
using System.IO;
using System.Linq;
using WebViewControl;

namespace ReactViewControl {
    internal class FileDependenciesProvider : IModuleDependenciesProvider {

        private const string JsEntryFileExtension = ".js.entry";
        private const string CssEntryFileExtension = ".css.entry";

        private readonly string sourcePath;

        public FileDependenciesProvider(string sourcePath) {
            this.sourcePath = sourcePath;
            
            DependencyJsSourcesCache = new Lazy<string[]>(() => GetDependenciesFromEntriesFile(JsEntryFileExtension));
            CssSourcesCache = new Lazy<string[]>(() => GetDependenciesFromEntriesFile(CssEntryFileExtension));
        }

        public string[] GetCssDependencies() => CssSourcesCache.Value;

        public string[] GetJsDependencies() => DependencyJsSourcesCache.Value;

        private Lazy<string[]> DependencyJsSourcesCache { get; }
        private Lazy<string[]> CssSourcesCache { get; }

        private string[] GetDependenciesFromEntriesFile(string extension) {
            var entriesFilePath = Path.Combine(Path.GetDirectoryName(sourcePath), Path.GetFileNameWithoutExtension(sourcePath) + extension);
            var resource = entriesFilePath.Split(new[] { Path.DirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries);

            using (var stream = GetResourceStream(resource)) {
                if (stream != null) {
                    using (var reader = new StreamReader(stream)) {
                        var allEntries = reader.ReadToEnd();
                        if (!string.IsNullOrEmpty(allEntries)) {
                            return allEntries.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
                        }
                    }
                }
            }
            return Array.Empty<string>();
        }

        private Stream GetResourceStream(string[] resource) => ResourcesManager.TryGetResourceWithFullPath(resource.First(), resource);
    }
}