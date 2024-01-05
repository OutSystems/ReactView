namespace ReactViewControl; 

public sealed class ModuleDependenciesProviderFactory : IModuleDependenciesProviderFactory {

    public static IModuleDependenciesProviderFactory Instance { get; set; } = new ModuleDependenciesProviderFactory();
    
    public IModuleDependenciesProvider CreateModuleDependenciesProvider(string sourcePath) {
        return new FileDependenciesProvider(sourcePath);
    }
}
