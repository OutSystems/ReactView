export class Task<ResultType> {

    private taskPromise: Promise<ResultType>;
    private resolve: (result: ResultType) => void;

    constructor() {
        this.taskPromise = new Promise<ResultType>((resolve) => this.resolve = resolve);
    }

    public setResult(result?: ResultType): void {
        this.resolve(result as ResultType);
    }

    public get promise(): Promise<ResultType> {
        return this.taskPromise;
    }

    public static delay(delay: number): Promise<void> {
        return new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
}