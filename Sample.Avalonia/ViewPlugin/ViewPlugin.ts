export interface IViewPluginProperties {
    notifyViewLoaded(viewName: string): void;
}

export default class ViewPlugin {

    constructor(private nativeObject: IViewPluginProperties) {
    }

    public notifyViewLoaded(viewName: string): void {
        this.nativeObject.notifyViewLoaded(viewName);
    }
}