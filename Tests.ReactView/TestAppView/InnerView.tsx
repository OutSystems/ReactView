import * as React from 'react';
import { ViewSharedContext } from 'ViewFrame';

interface IInnerViewProperties {
    loaded: () => void;
    methodCalled: (contextLoaded: boolean) => void;
}

interface IInnerViewBehaviors {
    testMethod(): void;
}

export default class InnerView extends React.Component<IInnerViewProperties, {}> implements IInnerViewBehaviors {

    private sharedContextLoaded = false;

    componentDidMount() {
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