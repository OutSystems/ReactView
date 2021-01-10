namespace ReactViewControl {
    public interface IModuleDependenciesProviderFactory {

        IModuleDependenciesProvider CreateDependenciesProviderInstance(string filename);
    }
}
