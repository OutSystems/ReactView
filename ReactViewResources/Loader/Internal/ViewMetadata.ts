import { ObservableListCollection } from "./ObservableCollection";
import { Task } from "./Task";

export type ViewMetadata = {
    id: number,
    name: string;
    generation: number;
    isMain: boolean;
    placeholder: Element; // element were the view is mounted (where the shadow root is mounted in case of child views)
    root?: Element; // view root element
    head?: Element; // view head element
    scriptsLoadTasks: Map<string, Task<void>>; // maps scripts urls to load tasks
    pluginsLoadTask: Task<void>; // plugins load task
    viewLoadTask: Task<void>; // resolved when view is loaded
    modules: Map<string, any>; // maps module name to module instance
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
        placeholder: placeholder,
        head: undefined,
        root: undefined,
        modules: new Map<string, any>(),
        nativeObjectNames: [],
        pluginsLoadTask: new Task(),
        viewLoadTask: new Task(),
        scriptsLoadTasks: new Map<string, Task<void>>(),
        childViews: new ObservableListCollection<ViewMetadata>(),
        context: null,
        parentView: null!
    };
}