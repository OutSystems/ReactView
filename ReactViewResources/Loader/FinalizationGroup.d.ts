declare class FinalizationGroup {
    /**
    * @param cleanupCallback This callback is called after the object is garbage collected, with an iterator of the holdings values.
    */
    constructor(cleanupCallback: (items: Iterable<any>) => void);
    /**
    * @param target The object whose lifetime we're concerned with.
    * @param holdings Used to represent that object when cleaning it up in the finalizer. (Note: holdings should not have a reference to the weak target, as that would prevent the target from being collected.)
    * @param unregisterToken An unregistration token, which is passed to the unregister method when the finalizer is no longer needed.
    */
    register(target: Object, holdings: any, unregisterToken?: any): void;
    /**
    * Unregister the finalization notification for the specified object token.
    * @param unregisterToken Token to unregister
    */
    unregister(unregisterToken: any): boolean;
    /**
     * 
     * @param cleanupCallback
     */
    cleanupSome(cleanupCallback?: (items: Iterable<any>) => void);
}