import { ObservableListCollection } from "./ObservableCollection";
import { Task } from "./Task";

export type ViewMetadata = {
    id: number,
    name: string;
    generation: number;
    isMain: boolean;
    isReleased: boolean; // set when the view is destroyed, so that whatever is still loading knows not to attach to it
    placeholder: Element; // element were the view is mounted (where the shadow root is mounted in case of child views)
    root?: Element; // view root element
    head?: Element; // view head element
    scriptsLoadTasks: Map<string, Task<void>>; // maps script source to load task, only used when scripts are tracked per view
    pluginsLoadTask: Task<void>; // plugins load task
    viewLoadTask: Task<void>; // resolved when view is loaded
    modules: Map<string, any>; // maps module name to module instance
    plugins: any[]; // plugin instances, disposed when the view is destroyed
    nativeObjectNames: string[]; // list of frame native objects
    childViews: ObservableListCollection<ViewMetadata>;
    parentView: ViewMetadata;
    context: any;
    renderHandler?: (component: React.ReactElement) => Promise<void>;
}

export function newView(id: number, name: string, isMain: boolean, placeholder: Element): ViewMetadata {
    return {
        id: id,
        name: name,
        generation: 0,
        isMain: isMain,
        isReleased: false,
        placeholder: placeholder,
        head: undefined,
        root: undefined,
        modules: new Map<string, any>(),
        plugins: [],
        scriptsLoadTasks: new Map<string, Task<void>>(),
        nativeObjectNames: [],
        pluginsLoadTask: new Task(),
        viewLoadTask: new Task(),
        childViews: new ObservableListCollection<ViewMetadata>(),
        context: null,
        parentView: null!
    };
}

/**
 * Releases what a destroyed view keeps alive. Plugins are not part of the react tree, so unmounting the view
 * does not reach them: one that registered itself in document level state - a listener on the document, an
 * entry in a handlers queue - stays registered, holding the view's root, and the whole tree under it, alive.
 */
export function releaseView(view: ViewMetadata): void {
    view.isReleased = true;

    view.plugins.forEach(plugin => disposePlugin(view, plugin));
    view.plugins = [];

    // holds the plugins and the view component, and each of those reaches the view's dom
    view.modules.clear();

    view.renderHandler = undefined;
    view.root = undefined;
    view.head = undefined;
}

function disposePlugin(view: ViewMetadata, plugin: any): void {
    if (!plugin || typeof plugin.dispose !== "function") {
        return;
    }

    try {
        plugin.dispose();
    } catch (error) {
        // this runs while react tears the view down, and reporting it the usual way rethrows, which would
        // abandon the rest of the teardown over a single plugin
        window.console.error(`Failed to dispose a plugin of view "${view.name}"`, error);
    }
}
