namespace ReactViewControl {
    public interface IModuleDependenciesProvider {

        string[] GetCssDependencies(string filename);

        string[] GetJsDependencies(string filename);
    }
}