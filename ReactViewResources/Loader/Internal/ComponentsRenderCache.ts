import { getStylesheets, waitForNextPaint } from "./Common";
import { ViewMetadata } from "./ViewMetadata";

export interface IRenderCacheEntry {
    cacheKey: string;
    componentSource: string;
}

export async function renderCachedView(view: ViewMetadata, componentSource: string, componentPropertiesHash: string): Promise<IRenderCacheEntry | null> {
    if (!view.isMain) {
        // disable render from cache for inner views, since react does not currently support portals hydration
        return null;
    }

    const componentCacheKey = componentSource + "|" + componentPropertiesHash;
    
    const cachedComponentHtml = localStorage.getItem(componentCacheKey);
    if (cachedComponentHtml) {
        // render cached component html to reduce time to first render
        view.root!.innerHTML = cachedComponentHtml;
        await waitForNextPaint();

        // already on cache, skip storing on cache
        return null;
    }

    return {
        cacheKey: componentCacheKey,
        componentSource: componentSource
    };
}

export function storeViewRenderInCache(view: ViewMetadata, cacheEntry: IRenderCacheEntry, maxPreRenderedCacheEntries: number): Promise<void> {
    // cache view html for further use
    const elementHtml = view.root!.innerHTML;
    // get all stylesheets except the sticky ones (which will be loaded by the time the html gets rendered) otherwise we could be loading them twice
    const stylesheets = getStylesheets(view.head!).filter(l => l.dataset.sticky !== "true").map(l => l.outerHTML).join("");

    // the remaining code can be executed afterwards
    return new Promise<void>(() => {
        // insert rendered html into the cache
        localStorage.setItem(cacheEntry.cacheKey, stylesheets + elementHtml);

        const componentCachedInfo = localStorage.getItem(cacheEntry.componentSource);
        const cachedEntries: string[] = componentCachedInfo ? JSON.parse(componentCachedInfo) : [];

        // remove cached entries that are older -> maintain cache size within limits
        while (cachedEntries.length >= maxPreRenderedCacheEntries) {
            const olderCacheEntryKey = cachedEntries.shift() as string;
            localStorage.removeItem(olderCacheEntryKey);
        }

        cachedEntries.push(cacheEntry.cacheKey);
        localStorage.setItem(cacheEntry.componentSource, JSON.stringify(cachedEntries));
    });
}