import { AssetInfo, NormalModule, PathData, RuleSetRule } from "webpack";

// Resource files
const getResourcesRuleSet = (assemblyName?: string, pluginsBase? : string): RuleSetRule => {

    const ResourcesRule: RuleSetRule = {
        test: /\.(ttf|png|jpg|jpeg|bmp|gif|woff|woff2|ico|svg|html)$/i,
        type: 'asset/resource',
        generator: {
            emit: false,
            filename: (pathData: PathData, _assetInfo?: AssetInfo): string => {
                const fileName: string = pathData.filename;
                if (fileName.indexOf(`/.pnpm/`) > 0) {
                    const nodeModules: string = fileName.substring(fileName.lastIndexOf("node_modules"));
                    if (pluginsBase) {
                        return pluginsBase + '/' + nodeModules;
                    }
                    else {
                        return assemblyName + '/' + nodeModules;
                    }
                }
                
                if (pathData.module) {
                    let module: NormalModule = pathData.module as NormalModule;
                    if (module.resourceResolveData) {
                        let resourceResolveData = module.resourceResolveData;
                        let assemblyFileName = resourceResolveData.descriptionFileData.name;
                        if (assemblyFileName.toUpperCase() === assemblyName.toUpperCase()) {
                            return assemblyName + '/' + pathData.filename;
                        }

                        if (!!pluginsBase && assemblyFileName.toUpperCase() === pluginsBase.toUpperCase()) {
                            return pluginsBase + '/' + pathData.filename;
                        }

                        throw new Error("ViewGenerator: Using a resource from an unsupported assembly.");
                    }
                }
                throw new Error("ViewGenerator: Resource not found.");
            }
        }
    };
    return ResourcesRule;
};

export default getResourcesRuleSet;
