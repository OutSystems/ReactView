import * as React from "react";
import { PropsWithChildren, useState, useEffect } from "react";

export interface IComponentWithMountCallbackProps {
    mounted?(): void;
}

export function ComponentWithMountCallback({ mounted, children }: PropsWithChildren<IComponentWithMountCallbackProps>): JSX.Element | null {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
        mounted?.();
    }, []);
    
    return isMounted ? <>{children}</> : null;
}
