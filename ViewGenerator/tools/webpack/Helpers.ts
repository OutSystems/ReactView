import {Dictionary, sanitizeCommandLineParam} from "./Plugins/Utils";

const getEntryName = (entryPath: string): string => {
    const fileExtensionLen: number = entryPath.length - entryPath.lastIndexOf(".");
    return entryPath.slice(entryPath.replace(/\//g, '\\').lastIndexOf("\\") + 1, -fileExtensionLen);
};

export function getEntries(entries: string): Dictionary<string>{
    const entryMap: Dictionary<string> = {};
    const sanitizeEntries = sanitizeCommandLineParam(entries);
    
    sanitizeEntries.split(";").map(entryPath => {
        console.log("EntryPath:", entryPath);
        console.log("EntryPath Name:", getEntryName(entryPath));
        entryMap[getEntryName(entryPath)] = './' + entryPath;
    });
    
    return entryMap;
}
