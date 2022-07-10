import { resolve } from "path";
import type { Page, Browser } from "playwright";
import { SiteSaver } from "./SiteSaver";
import { Path } from "./Path";
import { Thread } from "./Thread";

export interface SiteOptions {
  dataPath?: string;
}

export class Site {
  page!: Page;
  url: URL;
  dataPath: string;
  siteSaver: SiteSaver;
  pathHome: Path;

  paths = new Map<string, Path>();

  lastThreadId = -1;

  activeThreads: Thread<any[], any>[] = [];
  waitingThreads: [Thread<any[], any>, any[]][] = [];
  allThreads: Thread<any[], any>[] = [];
  hasNewThreads = false;

  constructor(
    readonly browser: Browser,
    readonly path: string,
    options?: SiteOptions
  ) {
    this.url = new URL(path);
    this.dataPath = resolve(options?.dataPath ?? process.cwd());
    this.siteSaver = new SiteSaver(this.dataPath, this.url);
    this.pathHome = new Path(this.url, this);

    this.paths.set(this.url.toString(), this.pathHome);
  }

  generateThreadId() {
    return ++this.lastThreadId;
  }

  pushThread<A extends any[], R extends Promise<any>>(
    threadId: number,
    fn: (...args: A) => R,
    args: A
  ) {
    const thread = new Thread<any[], any>(
      threadId,
      fn as (...args: any[]) => any
    );
    this.waitingThreads.push([thread, args]);

    this.allThreads.push(thread);

    this.hasNewThreads = true;

    this._newThread();
  }

  onEndThread(thread: Thread<any[], any>) {
    const hasThread = this.activeThreads.includes(thread);

    if (!hasThread) return;

    this.activeThreads = this.activeThreads.filter(
      (activeThread) => activeThread !== thread
    );
    this._newThread();
  }

  protected _newThread() {
    if (this.activeThreads.length < 5) {
      const nextThreadTuple = this.waitingThreads.shift();

      if (typeof nextThreadTuple === "undefined") return;

      const [nextThread, args] = nextThreadTuple;

      this.activeThreads.push(nextThread);

      nextThread.start(args).finally(() => {
        this.onEndThread(nextThread);
      });

      return;
    }
  }

  getThreads(threadId: number) {
    return this.allThreads.filter((thread) => thread.threadId === threadId);
  }

  async waitFinish(threadId?: number) {
    let lastThreads = threadId ? this.getThreads(threadId) : this.allThreads;

    do {
      this.hasNewThreads = false;
      await Promise.all(lastThreads.map((thread) => thread.wait()));
      lastThreads = threadId ? this.getThreads(threadId) : this.allThreads;
    } while (this.hasNewThreads);

    return;
  }

  get(path: URL) {
    return this.paths.get(path.toString());
  }

  has(path: URL) {
    return this.paths.has(path.toString());
  }

  onDiscoverPage(path: Path) {
    this.paths.set(path.url.toString(), path);

    if (!path.isExternal) console.log("Discovering: " + path.url.toString());
  }

  async run() {
    console.log(`Openning Site: ${this.path}`);
    const context = await this.browser.newContext();
    await this.siteSaver.init();

    await this.pathHome.run(context);

    await this.waitFinish();

    await context.close();
  }
}
