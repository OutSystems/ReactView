import { sync } from "glob";
import { parse, resolve } from "path";
import { getCurrentDirectory } from "./Plugins/Utils";
import {Configuration} from "webpack";

const config = (env) => {

    let entryMap = {};

    sync("**/*.worker.js", { follow: true }).forEach(f => {
        let entryName: string = parse(f).name;
        entryMap[entryName] = "./" + f;
    });

    const workersConfig: Configuration = {
        entry: entryMap,

        optimization: {
            minimize: true
        },

        output: {
            globalObject: 'self',
            path: resolve(getCurrentDirectory(), "Generated")
        },
    };
    
    if (env.useCache === "true") {
        workersConfig.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            name: "workersCache" 
        }
    }
    
    return workersConfig;
};

export default config;
