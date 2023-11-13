using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using ReactViewControl;

namespace Sample.Avalonia;

public class HotReloadDependenciesProvider : IModuleDependenciesProvider {

    private Dictionary<string, List<string>> dependencies;
    private readonly Uri uri;
    private readonly string basePath;
    private const string ManifestPath = "manifest.json";

    private DateTime lastRefresh;

    public HotReloadDependenciesProvider(Uri uri) {
        this.uri = uri;
        basePath = GetBaseSegmentFromUri();
        RefreshDependencies();
    }

    string[] IModuleDependenciesProvider.GetCssDependencies(string filename) {
        var entriesFilePath = Path.GetFileNameWithoutExtension(filename);

        if (!dependencies.ContainsKey(entriesFilePath)) {
            return Array.Empty<string>();
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
            return Array.Empty<string>();
        }

        RefreshDependencies();
        return dependencies[entriesFilePath]
            .Where(dependency => dependency.Contains(".js") && !dependency.Contains("ViewsRuntime"))
            .Select(dependency => basePath + dependency)
            .Reverse().Skip(1).Reverse().ToArray() // remove self reference
            .ToArray();
    }

    private void RefreshDependencies() {
        var timeSpan = DateTime.Now.Subtract(lastRefresh);
        if (timeSpan.TotalSeconds < 5) {
            return;
        }

        using var httpClient = new HttpClient();
        var json = httpClient.GetStringAsync(new Uri(uri, ManifestPath));
        json.Wait();

        dependencies = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(json.Result);
        lastRefresh = DateTime.Now;
    }
    
    private string GetBaseSegmentFromUri() {
        return uri.ToString();
    }
}
