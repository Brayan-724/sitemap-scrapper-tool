import type { Page, Browser } from "playwright";
import { SiteSaver } from "./SiteSaver";
import { Path } from "./Path";
import { Thread } from "./Thread";
export interface SiteOptions {
    dataPath?: string;
}
export declare class Site {
    readonly browser: Browser;
    readonly path: string;
    page: Page;
    url: URL;
    dataPath: string;
    siteSaver: SiteSaver;
    pathHome: Path;
    paths: Map<string, Path>;
    lastThreadId: number;
    activeThreads: Thread<any[], any>[];
    waitingThreads: [Thread<any[], any>, any[]][];
    allThreads: Thread<any[], any>[];
    hasNewThreads: boolean;
    constructor(browser: Browser, path: string, options?: SiteOptions);
    generateThreadId(): number;
    pushThread<A extends any[], R extends Promise<any>>(threadId: number, fn: (...args: A) => R, args: A): void;
    onEndThread(thread: Thread<any[], any>): void;
    protected _newThread(): void;
    getThreads(threadId: number): Thread<any[], any>[];
    waitFinish(threadId?: number): Promise<void>;
    get(path: URL): Path | undefined;
    has(path: URL): boolean;
    onDiscoverPage(path: Path): void;
    run(): Promise<void>;
}
