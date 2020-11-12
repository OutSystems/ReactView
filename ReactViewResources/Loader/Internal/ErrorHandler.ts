import { isDebugModeEnabled } from "./Environment";
import { showErrorMessage } from "./MessagesProvider";
import { ViewMetadata } from "./ViewMetadata";

export function handleError(error: Error | string, view?: ViewMetadata) {
    if (isDebugModeEnabled) {
        const msg = error instanceof Error ? error.message : error;
        showErrorMessage(msg, view ? view.root as HTMLElement : undefined);
    }
    throw error;
}