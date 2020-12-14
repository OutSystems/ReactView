(window as any).PluginModuleLoaded = true;

export default class Plugin {

    public viewLoaded: boolean = false;

    constructor(public nativeObject: object, public root: HTMLElement, loadPromise: Promise<void>) {
        loadPromise.then(() => this.viewLoaded = true); 
    }
}