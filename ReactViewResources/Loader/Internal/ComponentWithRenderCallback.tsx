import * as React from "react";
import { PropsWithChildren, useEffect } from "react";

export interface IComponentWithRenderCallbackProps {
    rendered: () => void;
}

export function ComponentWithRenderCallback({ rendered, children }: PropsWithChildren<IComponentWithRenderCallbackProps>): JSX.Element {
    useEffect(() => {
        rendered();
    });
    
    return <>{children}</>;
}
