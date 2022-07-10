import * as fs from "fs";
import * as fsPromises from "fs/promises";
import { join, resolve, dirname, sep as path$sep } from "path";

export class SiteSaver {
  hostname: string;
  basePath: string;

  constructor(readonly path: string, readonly url: URL) {
    this.hostname = this.url.hostname;
    this.basePath = resolve(this.path, this.hostname);
  }

  parsePath(path: string): string {
    return resolve(this.basePath, path);
  }

  exists(path: string): boolean {
    return this.existsRaw(this.parsePath(path));
  }

  existsRaw(path: string): boolean {
    return fs.existsSync(path);
  }

  async init(): Promise<void> {
    await this.mkdir("");

    const pathDeep = this.url.pathname.split(path$sep);
    const pathCreated: string[] = [];

    for (const pathPart of pathDeep) {
      await this.mkdir(join(...pathCreated, pathPart));
      pathCreated.push(pathPart);
    }
  }

  async mkdir(path: string): Promise<void> {
    const parsedPath = this.parsePath(path);

    const parentPath = dirname(parsedPath);

    if (!this.existsRaw(parentPath)) {
      this.mkdir(parentPath);
    }

    this.mkdirRaw(parsedPath);
  }

  async mkdirRaw(path: string): Promise<void> {
    if (!this.existsRaw(path)) {
      try {
        await fsPromises.mkdir(this.parsePath(path));
      } catch (e) {}
    }
  }

  async touch(path: string): Promise<void> {
    if (!this.exists(path)) {
      try {
        await fsPromises.writeFile(this.parsePath(path), "");
      } catch (e) {}
    }
  }

  async write(path: string, data: string | Buffer): Promise<void> {
    const parsedPath = this.parsePath(path);
    await this.mkdir(dirname(parsedPath));
    await fsPromises.writeFile(parsedPath, data);
  }

  async writeJson(path: string, data: Object, min = false) {
    await this.write(
      path,
      min ? JSON.stringify(data) : JSON.stringify(data, null, 2)
    );
  }
}
