export declare class Thread<A extends any[], R> {
    readonly threadId: number;
    private readonly fn;
    promise: Promise<R>;
    private result;
    private reason;
    private goodEnding;
    isStarted: boolean;
    isRunning: boolean;
    isEnded: boolean;
    protected startListeners: Array<() => void>;
    constructor(threadId: number, fn: (...args: A) => Promise<R>);
    waitStart(): Promise<true>;
    start(args: A): Promise<void | R>;
    wait(): Promise<void>;
    getEnding(): Promise<boolean>;
    getResult(): Promise<R>;
    getReason(): Promise<any>;
}
