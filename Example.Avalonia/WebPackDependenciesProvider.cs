using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Newtonsoft.Json;

namespace ReactViewControl {
    public class WebPackDependenciesProvider : IModuleDependenciesProvider {

        private Dictionary<string, List<string>> dependencies;
        private readonly Uri uri;
        private readonly string basePath;
        private const string ManifestPath = "manifest.json";

        public WebPackDependenciesProvider(Uri uri) {
            this.uri = uri;
            basePath = GetBaseSegmentFromUri();
            GetDependenciesFromUri();
        }

        public string GetBaseSegmentFromUri() {
            return "/" + uri.Segments.Last();
        }

        string[] IModuleDependenciesProvider.GetCssDependencies(string filename) {
            var entriesFilePath = Path.GetFileNameWithoutExtension(filename);

            if (!dependencies.ContainsKey(entriesFilePath)) {
                return new string[0];
            }

            return dependencies[entriesFilePath]
                .Where(dependency => dependency.Contains(".css"))
                .Select(dependency => basePath + dependency)
                .ToArray();
        }

        string[] IModuleDependenciesProvider.GetJsDependencies(string filename) {
            var entriesFilePath = Path.GetFileNameWithoutExtension(filename);
            
            if (!dependencies.ContainsKey(entriesFilePath)) {
                return new string[0];
            }

            return dependencies[entriesFilePath]
                .FindAll(dependency => dependency.Contains(".js"))
                .Select(dependency => basePath + dependency)
                .Reverse().Skip(1).Reverse().ToArray() // remove self reference
                .ToArray();
        }

        private void GetDependenciesFromUri() {
            using (var wc = new WebClient()) {
                var json = wc.DownloadString(new Uri(uri, ManifestPath));
                dependencies = JsonConvert.DeserializeObject<Dictionary<string, List<string>>>(json);
            }
        }
    }
}