using System.Net.Http;
using System.Text.Json;
using ReactViewControl;

namespace Sample.Avalonia;

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

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
        // TODO: fixme
        return uri.ToString();
        //return "/" + uri.Segments.Last();
    }

    string[] IModuleDependenciesProvider.GetCssDependencies(string filename) {
        var entriesFilePath = Path.GetFileNameWithoutExtension(filename);

        if (!dependencies.ContainsKey(entriesFilePath)) {
            return new string[0];
        }

        RefreshDependencies();
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

        RefreshDependencies();
        return dependencies[entriesFilePath]
            .Where(dependency => dependency.Contains(".js") && !dependency.Contains("ViewsRuntime"))
            .Select(dependency => basePath + dependency)
            .Reverse().Skip(1).Reverse().ToArray() // remove self reference
            .ToArray();
    }

    public void RefreshDependencies() {
        var shouldRefresh = true;

        var timeSpan = DateTime.Now.Subtract(lastRefresh);
        if (timeSpan.TotalSeconds < 5) {
            shouldRefresh = false;
        }

        if (shouldRefresh) {
            using var httpClient = new HttpClient();
            var assembly = typeof(Program).Assembly.GetName().Name;
            //  var json = httpClient.GetStringAsync(new Uri(uri, $"{assembly}/{ManifestPath}"));
            var json = httpClient.GetStringAsync(new Uri(uri, ManifestPath));
            json.Wait();

            dependencies = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(json.Result);
            lastRefresh = DateTime.Now;
        }
    }
}
