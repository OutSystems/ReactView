(window as any).PluginModuleLoaded = true;
(window as any).DisposedPluginModules = 0;

export default class Plugin {

    public viewLoaded: boolean = false;

    constructor(public nativeObject: object, public root: HTMLElement, loadPromise: Promise<void>) {
        loadPromise.then(() => this.viewLoaded = true); 
    }

    public dispose() {
        (window as any).DisposedPluginModules++;
    }
}
