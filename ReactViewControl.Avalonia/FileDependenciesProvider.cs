using System;
using System.IO;
using System.Linq;
using WebViewControl;

namespace ReactViewControl {
    class FileDependenciesProvider : IModuleDependenciesProvider {

        private const string JsEntryFileExtension = ".js.entry";
        private const string CssEntryFileExtension = ".css.entry";

        private readonly string sourcePath;

        public FileDependenciesProvider(string sourcePath) {
            DependencyJsSourcesCache = new Lazy<string[]>(() => GetDependenciesFromEntriesFile(JsEntryFileExtension));
            CssSourcesCache = new Lazy<string[]>(() => GetDependenciesFromEntriesFile(CssEntryFileExtension));
            this.sourcePath = sourcePath;
        }

        public string[] GetCssDependencies(string filename) => DependencyJsSourcesCache.Value;

        public string[] GetJsDependencies(string filename) => CssSourcesCache.Value;

        private Lazy<string[]> DependencyJsSourcesCache { get; }
        private Lazy<string[]> CssSourcesCache { get; }

        private string[] GetDependenciesFromEntriesFile(string extension) {
            var entriesFilePath = Path.Combine(Path.GetDirectoryName(sourcePath), Path.GetFileNameWithoutExtension(sourcePath) + extension);
            var resource = entriesFilePath.Split(new[] { Path.DirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries);

            using (var stream = GetResourceStream(resource)) {
                if (stream != null) {
                    using (var reader = new StreamReader(stream)) {
                        var allEntries = reader.ReadToEnd();
                        if (allEntries != null && allEntries != string.Empty) {
                            return allEntries.Split(new[] { "\n" }, StringSplitOptions.RemoveEmptyEntries);
                        }
                    }
                }
            }
            return new string[0];
        }

        private Stream GetResourceStream(string[] resource) => ResourcesManager.TryGetResourceWithFullPath(resource.First(), resource);
    }
}