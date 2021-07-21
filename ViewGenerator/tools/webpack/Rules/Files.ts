import { basename } from "path";
import { RuleSetRule } from "webpack";

// Resource files
const getResourcesRuleSet = (assemblyName?: string, pluginsBase? : string): RuleSetRule => {

    const ResourcesRule: RuleSetRule = {
        test: /\.(ttf|png|jpg|jpeg|bmp|gif|woff|woff2|ico|svg|html)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    emitFile: false,
                    name: '[path][name].[ext]',
                    publicPath: (url: string, _, context: string) => {

                        // URL can be one of the following:
                        //
                        // - 1) A relative path to a resource in another assembly, e.g. "_/MyOtherAssembly/Path/to/Resource.png"
                        // - 2) A relative path to a resource in the assembly itself, e.g. "Path/to/Resource.png"
                        // - 3) An absolute path to a resource in another assembly, e.g. "Z:/MyOtherAssembly/Path/to/Resource.png"
                        // - 4) An absolute path to a resource in assembly itself, e.g. "Z:/MyAssembly/Path/to/Resource.png"
                        //
                        // Context represents the path of the project being built by webpack, e.g. "C:\Git\Path\to\Project\"
                        //
                        const PackagesFolder = "/packages/";
                        const isOutSystemsPackagesWithOldNaming = (url) => {
                            // means that the package name is (example) "web_feedback-message" or "web_image" instead of "web-feedback-message" or "web-image"
                            const OutSystemsPackagesWithOldNaming = [
                                "/carousel/",
                                "/checkbox/",
                                "/collapsible/",
                                "/common/",
                                "/editable-label/",
                                "/feedback-message/",
                                "/image/",
                                "/input/",
                                "/loading-legacy/",
                                "/loading-wheel/",
                                "/navigation-bar/",
                                "/optioncards/",
                                "/overlay/",
                                "/progressbar/",
                                "/radio-button/",
                                "/slider/",
                                "/splitter/",
                                "/tabs/",
                                "/theme/",
                                "/theme-provider/",
                                "/toggle/",
                            ];

                            for(var i = 0; i < OutSystemsPackagesWithOldNaming.length; ++i) {
                                if(url.indexOf(OutSystemsPackagesWithOldNaming[i]) > 0) {
                                    return true;
                                }
                            }
                            return false;
                        }
                        const buildUrl = (url: string, resourceBase: string): string => {
                            const PackagesFolder = "/packages/";
                            let isOutSystemsWebPackage = false;
                            let idx: number = url.indexOf(`/${resourceBase}/`);
                            if (idx < 0 && pluginsBase) {
                                idx = url.indexOf(`/${pluginsBase}/`);
                            }
                            if (idx < 0 && url.indexOf(PackagesFolder) > 0) {
                                // OutSystems web components packages
                                idx = url.indexOf(`${url}`);
                                isOutSystemsWebPackage = true;
                            }

                            // relative paths starting with ".." are replaced by "_"
                            if (url.startsWith("_")) {
                                if (idx < 0) {
                                    // URL (argument) is a relative path and we did not find the resource base path or the plugin assembly in its content
                                    throw new Error("VG001: Resource not found: using a resource from another namespace without an absolute URL.");
                                }

                                // URL (argument) is a relative path and contains the resource base path or the plugin assembly in its content
                                if(isOutSystemsWebPackage) {
                                    let packg = url.substring(url.indexOf(PackagesFolder) + PackagesFolder.length);
                                    return `/${pluginsBase}/node_modules/@outsystems/web${(isOutSystemsPackagesWithOldNaming(url)) ? "_" : "-"}${packg}`;
                                } else {
                                    return url.substring(idx);
                                }
                            }

                            if (idx >= 0) {
                                // URL (argument) is an absolute path and contains the resource base path or the plugin assembly in its content
                                return url.substring(idx);
                            }

                            if (url.substring(1).startsWith(":/")) {
                                // URL (argument) is an absolute path and we did not find the resource base path or the plugin assembly in its content
                                throw new Error("VG002: Resource not found: using a resource from another namespace without an absolute URL.");
                            }

                            // URL is a relative path and contains the assembly in its content
                            return `/${resourceBase}/${url}`;
                        };

                        let resourceBase: string = basename(context);
                        let result: string = buildUrl(url, resourceBase);

                        // Replace resource base path with assembly name, as the project folder name might be different
                        // than the assembly name.
                        if (assemblyName && resourceBase !== assemblyName) {
                            return result.replace(`/${resourceBase}/`, `/${assemblyName}/`)
                        }

                        return result;
                    }
                },
            },
        ]
    };
    return ResourcesRule;
};

export default getResourcesRuleSet;
