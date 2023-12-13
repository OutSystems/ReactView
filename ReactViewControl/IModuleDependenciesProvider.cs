namespace ReactViewControl {
    public interface IModuleDependenciesProvider {
        string[] GetCssDependencies();

        string[] GetJsDependencies();
    }
}