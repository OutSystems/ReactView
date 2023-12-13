namespace ReactViewControl; 

public class ModuleDependenciesProviderFactory : IModuleDependenciesProviderFactory {

    public static IModuleDependenciesProviderFactory Instance { get; private set; } = new ModuleDependenciesProviderFactory();

    public static void SetInstance(IModuleDependenciesProviderFactory factory) {
        Instance = factory;
    }
    
    public virtual IModuleDependenciesProvider CreateModuleDependenciesProvider(string sourcePath) {
        return new FileDependenciesProvider(sourcePath);
    }
}
