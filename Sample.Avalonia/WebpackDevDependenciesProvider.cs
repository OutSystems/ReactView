using ReactViewControl;

namespace Sample.Avalonia;

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
//using Newtonsoft.Json;

public class WebPackDependenciesProvider : IModuleDependenciesProvider {

    private Dictionary<string, List<string>> dependencies;
    private readonly Uri uri;
    private readonly string basePath;
    private const string ManifestPath = "manifest.json";

    private DateTime lastRefresh;

    public WebPackDependenciesProvider(Uri uri) {
        this.uri = uri;
        basePath = GetBaseSegmentFromUri();
        RefreshDependencies();
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

    public void RefreshDependencies() {
        var shouldRefresh = true;

        if (lastRefresh != null) {
            var timeSpan = DateTime.Now.Subtract(lastRefresh);
            if (timeSpan.TotalSeconds < 10) {
                shouldRefresh = false;
            }
        }

        if (shouldRefresh) {
            lastRefresh = DateTime.Now;
            using (var wc = new WebClient()) {
                var json = wc.DownloadString(new Uri(uri, ManifestPath));
               // dependencies = JsonConvert.DeserializeObject<Dictionary<string, List<string>>>(json);
            }
        }
    }
}
