declare type RequestIdleCallback = (deadline: { timeRemaining: () => number, didTimeout: boolean }) => void;

declare function requestIdleCallback(callback: RequestIdleCallback): number;

declare function gc(): void;