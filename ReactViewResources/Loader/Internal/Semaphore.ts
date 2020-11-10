import { Task } from "./Task";

export class Semaphore {

    private counter: number = 0;
    private tasks: Task<void>[] = [];

    constructor(private max: number) { }

    public acquire(): Promise<void> {
        if (this.counter < this.max) {
            this.counter++
            return Promise.resolve();
        }

        const task = new Task<void>();
        this.tasks.push(task);
        return task.promise;
    }


    public release(): void {
        if (this.counter < 1) {
            return;
        }
        
        if (this.tasks.length < 1) {
            this.counter--;
            return;
        }

        this.tasks.shift()!.setResult();
    }
}