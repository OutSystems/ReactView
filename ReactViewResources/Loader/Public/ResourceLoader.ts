import * as React from "react";
import { ResourceLoaderUrlFormatter } from "ResourceLoader";
import { customResourceBaseUrl } from "../Internal/Environment";

export function formatUrl(viewName: string, resourceKey: string, ...params: string[]): string {
    const urlTail = [resourceKey].concat(params).map(p => encodeURIComponent(p)).join("&");
    return `${customResourceBaseUrl}/${viewName}/?${urlTail}`;
}

export const ResourceLoader = React.createContext<ResourceLoaderUrlFormatter>(() => "");

window["ResourceLoader"] = { ResourceLoader: ResourceLoader, formatUrl: formatUrl };