import { join, sep as path$sep } from "path";
import type { Page, BrowserContext } from "playwright";
import type { Site } from "./Site";

export class Path {
  parents = new Set<string>();
  childs = new Set<string>();

  isExternal: boolean;

  constructor(readonly url: URL, readonly site: Site) {
    this.isExternal = url.hostname !== site.url.hostname;
  }

  async goto(page: Page): Promise<void> {
    await page.goto(this.url.toString());
  }

  async getAllLinks(page: Page): Promise<string[]> {
    const links = page.locator("a[href]");

    const hrefs = await links.evaluateAll((linksNodes) => {
      return linksNodes
        .map((linkNode) => linkNode.getAttribute("href"))
        .filter((href) => !!href) as string[];
    });

    return hrefs;
  }

  async run(context: BrowserContext) {
    await new Promise((res) => setTimeout(res, 100));

    const myPage = await context.newPage();
    try {
      await this.goto(myPage);
    } catch (e: any) {
      console.error(e.message);
      await myPage.close();
      return;
    }

    try {
      const screenshot = await myPage.screenshot({
        type: "jpeg",
        quality: 50,
        clip: {
          x: 0,
          y: 0,
          width: 1024,
          height: 1024,
        },
        scale: "css",
      });

      const pathname = this.url.pathname.split("/");

      pathname.shift();

      const screenshotPath = join(pathname.join(path$sep), "screenshot.jpg");

      await this.site.siteSaver.write(screenshotPath, screenshot);
    } catch (e: any) {
      console.error(e.message);
    }

    try {
      const linksRaw = await this.getAllLinks(myPage);
      const links = Path.filterPaths(Path.normalizePaths(linksRaw, this.url));

      const threadId = this.site.generateThreadId();

      for (const link of links) {
        const url = new URL(link);
        const alreadyScrapped = this.site.has(url);

        const path = alreadyScrapped
          ? (this.site.get(url) as Path)
          : new Path(url, this.site);

        path.parents.add(this.url.toString());
        this.childs.add(url.toString());

        if (alreadyScrapped) continue;

        this.site.onDiscoverPage(path);

        if (!path.isExternal) {
          this.site.pushThread(threadId, path.run.bind(path), [context]);
        }
      }
    } catch (e: any) {
      console.error(e.message);
    }

    await myPage.close();
  }

  static normalizePath(path: string, url: URL) {
    const p0 = path.replace(/^\/\//, "http://");
    let p1: string = p0;

    if (
      p1.match(
        /^(?!https?:\/\/[^.\/]+\.(?:[^.\/]+\.?)+)(\/?[a-z.-_09]+)+$/i
      ) !== null
    ) {
      const pathname = url.pathname.endsWith("/")
        ? url.pathname
        : url.pathname + "/";
      const p1_0 = p1.startsWith("/") ? p1 : pathname + p1; // A

      console.log(p1, p1_0);
      p1 = url.origin + p1_0;
    }

    return p1;
  }

  static normalizePaths(paths: string[], url: URL) {
    return paths.map((path) => Path.normalizePath(path, url));
  }

  static filterPaths(paths: string[]) {
    return paths.filter((path) => {
      return path.startsWith("http");
    });
  }
}
