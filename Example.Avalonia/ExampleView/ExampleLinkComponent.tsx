import * as React from "react";
import { useExampleContext } from "./ExampleView";

interface IExampleLinkProperties {
    example: string;
}

export function ExampleLinkComponent(props: IExampleLinkProperties): JSX.Element {
    const { exampleCallBackWithParameter } = useExampleContext();
    return <button onClick={() => exampleCallBackWithParameter(props.example)}>{"Click me to test React Context API through the ViewFrame!"}</button>;
}