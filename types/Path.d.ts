import type { Page, BrowserContext } from "playwright";
import type { Site } from "./Site";
export declare class Path {
    readonly url: URL;
    readonly site: Site;
    parents: Set<string>;
    childs: Set<string>;
    isExternal: boolean;
    constructor(url: URL, site: Site);
    goto(page: Page): Promise<void>;
    getAllLinks(page: Page): Promise<string[]>;
    run(context: BrowserContext): Promise<void>;
    static normalizePath(path: string, url: URL): string;
    static normalizePaths(paths: string[], url: URL): string[];
    static filterPaths(paths: string[]): string[];
}
