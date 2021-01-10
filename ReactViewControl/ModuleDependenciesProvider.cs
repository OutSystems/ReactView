using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebViewControl;

namespace ReactViewControl {
    class ModuleDependenciesProvider : IModuleDependenciesProvider {

        private const string JsEntryFileExtension = ".js.entry";
        private const string CssEntryFileExtension = ".css.entry";

        private readonly string sourcePath;

        public ModuleDependenciesProvider(string sourcePath) => this.sourcePath = sourcePath;

        public string[] GetCssDependencies(string filename) => GetDependenciesFromEntriesFile(CssEntryFileExtension);

        public string[] GetJsDependencies(string filename) => GetDependenciesFromEntriesFile(JsEntryFileExtension);

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

        private Stream GetResourceStream(string[] resource) {
            //var isHotReloadEnabled = childViewHost?.IsHotReloadEnabled ?? DevServerUri != null;
            //if (isHotReloadEnabled) {
            //    return File.OpenRead(Path.Combine(Path.GetDirectoryName(Source), resource.Last()));
            //}

            return ResourcesManager.TryGetResourceWithFullPath(resource.First(), resource);
        }
    }
}
