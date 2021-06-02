import dummy from "ModuleWithAlias";
import { IPluginsContext } from 'PluginsProvider';
import * as React from 'react';
import { ViewFrame, ViewSharedContext } from "ViewFrame";
import * as Image from "./imgs/image.png";
import InnerView from "./InnerView";
import Plugin from './PluginModule';
import "./Styles.scss";
import { Task } from "./Task";

interface IAppProperties {
    event: (args: string) => void;
    propertyValue: string;
    autoShowInnerView: boolean;
}

interface IChildViews {
    test: InnerView;
}

class App extends React.Component<IAppProperties> {
    firstRenderHtml: string;
    pluginsContext: IPluginsContext;
    innerViewLoadedTask = new Task<boolean>();

    constructor(props: IAppProperties, context: IPluginsContext) {
        super(props);
        this.pluginsContext = context;
        this.firstRenderHtml = this.getHtml();
    }

    renderInnerViewContainer() {
        if (this.props.autoShowInnerView) {
            return <ViewFrame<IChildViews> key="test_frame" name="test" className="" loaded={() => this.innerViewLoadedTask.setResult()} />;
        }

        return null;
    }

    componentDidMount() {
        if (!this.props.autoShowInnerView) {
            this.props.event("NoInnerView");
        }
    }

    render() {
        const uniqueTimestamp = new Date().getTime() + "" + Math.random() ;
        return (
            <div className="App">
                <div className="App-header">
                    <h2>Welcome to React</h2>
                    <img src={Image} />
                    <div>Cache timestamp: {uniqueTimestamp}</div>
                    <div>Property value: {this.props.propertyValue}</div>
                    <ViewSharedContext.Provider value={{ value: true }}>
                        {this.renderInnerViewContainer()}
                    </ViewSharedContext.Provider>
                </div>
            </div>
        );
    }

    callEvent() {
        this.props.event("");
    }

    checkStyleSheetLoaded(stylesheetsCount: number) {
        function getText(stylesheet: CSSStyleSheet): string {
            return Array.from(stylesheet.rules).map(rule => {
                if (rule instanceof CSSImportRule) {
                    return getText(rule.styleSheet);
                } else {
                    return rule.cssText;
                }
            }).join("\n");
        }

        var intervalHandle = 0;
        intervalHandle = setInterval(() => {
            if (document.styleSheets.length >= stylesheetsCount) {
                var stylesheets = Array.from(document.styleSheets).map(s => getText(s as CSSStyleSheet)).join("\n");
                this.props.event(stylesheets);
                clearInterval(intervalHandle);
            }
        }, 50);
    }

    checkPluginModuleLoaded() {
        if ((window as any).PluginModuleLoaded) {
            this.props.event("PluginModuleLoaded");
        }
    }

    checkAliasedModuleLoaded() {
        if (dummy()) {
            this.props.event("AliasedModuleLoaded");
        }
    }

    checkPluginInContext() {
        const plugin = this.pluginsContext.getPluginInstance<Plugin>(Plugin);
        return [!!plugin.nativeObject, !!plugin.root.tagName, plugin.viewLoaded];
    }

    checkInnerViewLoaded() {
        this.innerViewLoadedTask.promise.then(() => this.props.event("InnerViewLoaded"));
    }

    loadCustomResource(url: string) {
        console.log(url);
        var img = document.createElement("img");
        img.src = url;
        document.body.appendChild(img);
    }

    getFirstRenderHtml() {
        return this.firstRenderHtml;
    }

    getHtml() {
        return this.getRoot().innerHTML || "";
    }

    getPropertyValue() {
        return this.props.propertyValue;
    }

    getCurrentTime() {
        return new Date().valueOf();
    }

    getStartTime() {
        return window.performance.timing.navigationStart;
    }

    reload() {
        window.location.reload();
    }

    private getRoot() {
        return document.body.firstElementChild as HTMLElement;
    }
}

export default App; 