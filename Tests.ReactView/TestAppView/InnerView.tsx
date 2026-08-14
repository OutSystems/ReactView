import * as React from 'react';
import { ViewSharedContext } from 'ViewFrame';

interface IInnerViewProperties {
    loaded: () => void;
    methodCalled: (contextLoaded: boolean) => void;
    valueReturningMethodCalled: (contextLoaded: boolean) => Promise<string>;
}

interface IInnerViewBehaviors {
    testMethod(): void;
}

export default class InnerView extends React.Component<IInnerViewProperties, {}> implements IInnerViewBehaviors {

    private sharedContextLoaded = false;

    componentDidMount() {
        // kept around on purpose, so that a test can call into this view's native object after the view
        // itself is gone
        (window as any).InnerViewProperties = this.props;
        this.props.loaded();
    }

    render() {
        return (
            <ViewSharedContext.Consumer>
                {context => (
                    <div ref={() => {
                        this.sharedContextLoaded = context && context.value;
                    }}>
                        inner view
                    </div>
                )}
            </ViewSharedContext.Consumer>
        );
    }

    testMethod() {
        this.props.methodCalled(this.sharedContextLoaded);
    }
}