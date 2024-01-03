using System;
using ReactViewControl;

namespace Sample.Avalonia; 

public sealed class HotReloadDependenciesProviderFactory : IModuleDependenciesProviderFactory {

    private readonly string devServerUri;

    public HotReloadDependenciesProviderFactory(string devServerUri) {
        this.devServerUri = devServerUri;
    }

    public IModuleDependenciesProvider CreateModuleDependenciesProvider(string sourcePath) {
        return new HotReloadDependenciesProvider(new Uri($"{devServerUri}{typeof(HotReloadDependenciesProviderFactory).Assembly.GetName().Name}/"), sourcePath);
    }
}