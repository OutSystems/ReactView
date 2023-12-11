using System;
using ReactViewControl;

namespace Sample.Avalonia; 

public class HotReloadDependenciesProviderFactory : ModuleDependenciesProviderFactory {

    private readonly string devServerUri;

    public HotReloadDependenciesProviderFactory(string devServerUri) {
        this.devServerUri = devServerUri;
    }

    public override IModuleDependenciesProvider CreateModuleDependenciesProvider(string sourcePath) {
        return new HotReloadDependenciesProvider(new Uri($"{devServerUri}{typeof(HotReloadDependenciesProviderFactory).Assembly.GetName().Name}/"), sourcePath);
    }
}