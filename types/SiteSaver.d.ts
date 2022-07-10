/// <reference types="node" />
export declare class SiteSaver {
    readonly path: string;
    readonly url: URL;
    hostname: string;
    basePath: string;
    constructor(path: string, url: URL);
    parsePath(path: string): string;
    exists(path: string): boolean;
    existsRaw(path: string): boolean;
    init(): Promise<void>;
    mkdir(path: string): Promise<void>;
    mkdirRaw(path: string): Promise<void>;
    touch(path: string): Promise<void>;
    write(path: string, data: string | Buffer): Promise<void>;
    writeJson(path: string, data: Object, min?: boolean): Promise<void>;
}
