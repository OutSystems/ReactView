namespace ReactViewControl; 

public interface IModuleDependenciesProviderFactory {
    
    IModuleDependenciesProvider CreateModuleDependenciesProvider(string sourcePath);
}
