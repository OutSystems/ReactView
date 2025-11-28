export class TaskUI<ResultType> {
    private taskPromise: Promise<ResultType>;
    private resolve: (result: ResultType) => void;
    private reject: (error: Error) => void;

    constructor() {
        this.taskPromise = new Promise<ResultType>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    public setResult(result?: ResultType): void {
        this.resolve(result as ResultType);
    }

    public setFailure(result?: Error): void {
        this.reject(result as Error);
    }

    public get promise(): Promise<ResultType> {
        return this.taskPromise;
    }
}