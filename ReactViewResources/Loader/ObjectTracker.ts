import { ITrackable } from "Trackable";

let trackedObjectsCounter = 0;
const trackablesFinalizationWatcher = new FinalizationGroup(onTrackableObjectGCed);
//const trackedObjects = new Map<string, WeakRef>();

function onTrackableObjectGCed(holdings: Iterable<object>) {
    console.log("released objects");
    for (const trackId of holdings) {
        console.log("released object with id " + trackId);
    }
}

function queueCleanup() {
    if (trackedObjectsCounter > 0) {
        requestIdleCallback(() => {
            gc();
            trackedObjectsCounter = 0;
        });
    }
    //if (trackedObjects.size > 0) {
    //    requestIdleCallback((deadline) => {
    //        for (const [trackId, ref] of trackedObjects.entries()) {
    //            if (!ref.deref()) {
    //                // console.log("released object with id " + trackId);
    //                trackedObjects.delete(trackId);
    //            }
    //            if (deadline.didTimeout) {
    //                requestIdleCallback(queueCleanup);
    //                break;
    //            }
    //        }
    //    });
    //}
}

export function track(obj: any, recurse: boolean = true) {
    queueCleanup();

    const trackable = <ITrackable>obj;
    const trackId = trackable.trackId;
    if (trackId) {
        // console.log("tracking object " + trackId);
        //trackedObjects.set(trackId, new WeakRef(trackable));
        trackablesFinalizationWatcher.register(trackable, trackId);
        trackedObjectsCounter++;
        return;
    }

    // its supposed to recurse just the first level
    if (recurse && Array.isArray(obj)) {
        const trackables = new Array<ITrackable>();

        // get all trackable objects
        for (const item of (<ITrackable[]> obj)) {
            if (item && !item.trackId && trackables.length === 0) {
                // found the first object non-null, and is not a trackable, bail-out (we assume that all objects in the collection should be trackable)
                return;
            }
            trackables.push(item);
        }

        for (const item of trackables) {
            track(item, false);
        }
    }
}