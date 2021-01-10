namespace ReactViewControl {
    public class ModuleDependenciesProviderFactory : IModuleDependenciesProviderFactory {

        public IModuleDependenciesProvider CreateDependenciesProviderInstance(string filename) => new ModuleDependenciesProvider(filename);
    }
}
