export class Thread<A extends any[], R> {
  promise!: Promise<R>;
  private result!: R;
  private reason!: any;
  private goodEnding!: boolean;

  isStarted: boolean = false;
  isRunning: boolean = false;
  isEnded: boolean = false;

  protected startListeners: Array<() => void> = [];

  constructor(
    readonly threadId: number,
    private readonly fn: (...args: A) => Promise<R>
  ) {}

  waitStart(): Promise<true> {
    if (this.isStarted) return Promise.resolve(true);

    return new Promise<true>((res) => {
      this.startListeners.push(() => {
        res(true);
      });
    });
  }

  async start(args: A) {
    const promise = this.fn(...args)
      .then(
        (result: R) => {
          this.result = result;
          this.goodEnding = true;
          this.isRunning = false;
          return Promise.resolve(result);
        },
        (reason: any) => {
          this.reason = reason;
          this.goodEnding = false;
          this.isRunning = false;
        }
      )
      .finally(() => (this.isEnded = true));

    this.promise = promise as Promise<R>;
    this.isStarted = true;
    this.isRunning = true;

    this.startListeners.forEach((fn) => fn());

    return promise;
  }

  async wait() {
    if (this.isEnded) return;

    if (!this.isStarted) await this.waitStart();

    if (this.isRunning) {
      await this.promise;
    }
  }

  async getEnding() {
    await this.wait();

    return this.goodEnding;
  }

  async getResult() {
    await this.wait();

    if (!this.goodEnding) throw this.reason;

    return this.result;
  }

  async getReason() {
    await this.wait();

    if (this.goodEnding) throw this.result;

    return this.reason;
  }
}
