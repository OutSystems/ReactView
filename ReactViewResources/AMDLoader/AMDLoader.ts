declare const exports: {};

/**
 * Simple AMD module loader.
 * */
namespace AMDLoader {
    export const defines: { [module: string]: boolean } = {};
    const promises: { [module: string]: Promise<any> } = {};
    const resolves: { [module: string]: Function } = {};

    export let timeout = 5000;

    export function getOrCreateDependencyPromise(name: string): Promise<any> {
        name = name.replace(/^.\//, "").toLowerCase();
        if (!promises[name]) {
            promises[name] = new Promise((resolve, reject) => {
                if (timeout > 0) {
                    let timeoutHandle = setTimeout(() => reject(new Error(`Timeout loading '${name}'`)), timeout);
                    let originalResolve = resolve;
                    resolve = function () {
                        clearTimeout(timeoutHandle);
                        originalResolve.apply(null, arguments);
                    };
                }
                resolves[name] = resolve;
            });
        }
        return promises[name];
    }

    export function resolve(name: string, value: any): void {
        getOrCreateDependencyPromise(name); // create promise if necessary
        resolves[name](value);
        defines[name] = true;
    }

    export function require(deps: string[], definition: Function): void {
        if (!deps || deps.length === 0) {
            definition.apply(null, []);
            return;
        }
        const promises = deps.map(getOrCreateDependencyPromise);
        Promise.all(promises).then((result) => {
            if (definition) {
                definition.apply(null, result);
            }
        });
    }
}

const define = function (name: string, deps: string[], definition: Function): void {
    if (typeof name !== "string") {
        throw new Error("Unnamed modules are not supported");
    }

    const originalName = name;
    name = name.toLowerCase();

    if (name in AMDLoader.defines) {
        throw new Error("Module " + name + " already defined");
    }

    // append the module path to the modules that have relative paths
    const modulePath = name.substr(0, name.lastIndexOf("/"));
    deps = deps.map(d => d.startsWith("./") ? modulePath + d.substr(1) : d);

    AMDLoader.require(deps, function () {
        const exportsIdx = deps.indexOf("exports");
        if (exportsIdx >= 0) {
            // create a brand new export object to store the module exports
            arguments[exportsIdx] = {};
        }
        const moduleExports = definition.apply(null, arguments) || arguments[exportsIdx];
        AMDLoader.resolve(name, moduleExports);
        exports[originalName] = moduleExports;
    });
}

define.amd = {};

define("require", [], function () { return AMDLoader.require; });
define("exports", [], function () { return {}; });