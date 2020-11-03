window["Views"] = window["Views"] || {}; window["Views"]["SubExampleView"] =
(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["SubExampleView"],{

/***/ "./ExampleView/SubExampleView.scss":
/*!*****************************************!*\
  !*** ./ExampleView/SubExampleView.scss ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./ExampleView/SubExampleView.tsx":
/*!****************************************!*\
  !*** ./ExampleView/SubExampleView.tsx ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! react */ "react"), __webpack_require__(/*! ./ViewPlugin */ "./ExampleView/ViewPlugin.ts"), __webpack_require__(/*! PluginsProvider */ "PluginsProvider"), __webpack_require__(/*! ResourceLoader */ "ResourceLoader"), __webpack_require__(/*! ./SubExampleView.scss */ "./ExampleView/SubExampleView.scss")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, React, ViewPlugin_1, PluginsProvider_1, ResourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SubExampleComponent extends React.Component {
        constructor(props, context) {
            super(props, context);
        }
        render() {
            return React.createElement("div", null,
                "Plugins provider available: ",
                this.context.getPluginInstance ? "yes" : "no");
        }
    }
    SubExampleComponent.contextType = PluginsProvider_1.PluginsContext;
    class SubExampleView extends React.Component {
        constructor(props, context) {
            super(props, context);
            this.initialize();
            this.viewplugin = context.getPluginInstance(ViewPlugin_1.default);
        }
        async initialize() {
            this.state = {
                time: "-",
                dotNetCallCount: 0,
                buttonClicksCount: 0
            };
            let time = await this.props.getTime();
            this.setState({ time: time });
        }
        callMe() {
            this.setState(s => {
                return {
                    dotNetCallCount: s.dotNetCallCount + 1
                };
            });
        }
        componentDidMount() {
            this.viewplugin.notifyViewLoaded("SubExampleView");
        }
        render() {
            return (React.createElement("div", { className: "wrapper" },
                this.props.constantMessage,
                React.createElement("br", null),
                "Current time (+1hr): ",
                this.state.time,
                React.createElement("br", null),
                React.createElement("br", null),
                "Dot net calls count: ",
                this.state.dotNetCallCount,
                React.createElement("br", null),
                "Button clicks count: ",
                this.state.buttonClicksCount,
                React.createElement("br", null),
                React.createElement(SubExampleComponent, null),
                React.createElement("br", null),
                "Custom resource:",
                React.createElement(ResourceLoader_1.ResourceLoader.Consumer, null, url => React.createElement("img", { src: url("Completed.png", "size=normal") })),
                React.createElement("br", null),
                React.createElement("input", null),
                React.createElement("button", { accessKey: "z", onClick: () => this.setState(s => { return { buttonClicksCount: s.buttonClicksCount + 1 }; }) }, "Click me!"),
                "\u00A0"));
        }
    }
    exports.default = SubExampleView;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ "PluginsProvider":
/*!**********************************!*\
  !*** external "PluginsProvider" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["PluginsProvider"]; }());

/***/ }),

/***/ "ResourceLoader":
/*!*********************************!*\
  !*** external "ResourceLoader" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["ResourceLoader"]; }());

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["React"]; }());

/***/ })

},[["./ExampleView/SubExampleView.tsx","ViewsRuntime","ExampleView~SubExampleView~ViewPlugin"]]]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9WaWV3cy8uL0V4YW1wbGVWaWV3L1N1YkV4YW1wbGVWaWV3LnNjc3M/ZmRkNSIsIndlYnBhY2s6Ly9WaWV3cy8uL0V4YW1wbGVWaWV3L1N1YkV4YW1wbGVWaWV3LnRzeCIsIndlYnBhY2s6Ly9WaWV3cy9leHRlcm5hbCBcIlBsdWdpbnNQcm92aWRlclwiIiwid2VicGFjazovL1ZpZXdzL2V4dGVybmFsIFwiUmVzb3VyY2VMb2FkZXJcIiIsIndlYnBhY2s6Ly9WaWV3cy9leHRlcm5hbCBcIlJlYWN0XCIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHVDOzs7Ozs7Ozs7OztBQ0FBLGlHQUFPLENBQUMsbUJBQVMsRUFBRSxPQUFTLEVBQUUseUNBQU8sRUFBRSxzRUFBYyxFQUFFLDZEQUFpQixFQUFFLDJEQUFnQixFQUFFLHFGQUF1QixDQUFDLG1DQUFFO0FBQ3RIO0FBQ0Esa0RBQWtELGNBQWM7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGFBQWE7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsdUJBQXVCO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVIQUF1SCwyQ0FBMkM7QUFDbEs7QUFDQTtBQUNBLCtDQUErQyxvREFBb0QsU0FBUyw4Q0FBOEMsRUFBRSxHQUFHO0FBQy9KO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUFBLG9HQUFDOzs7Ozs7Ozs7Ozs7QUNoRUYsYUFBYSw0Q0FBNEMsRUFBRSxJOzs7Ozs7Ozs7OztBQ0EzRCxhQUFhLDJDQUEyQyxFQUFFLEk7Ozs7Ozs7Ozs7O0FDQTFELGFBQWEsa0NBQWtDLEVBQUUsSSIsImZpbGUiOiJHZW5lcmF0ZWQvU3ViRXhhbXBsZVZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW4iLCJkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIiwgXCJyZWFjdFwiLCBcIi4vVmlld1BsdWdpblwiLCBcIlBsdWdpbnNQcm92aWRlclwiLCBcIlJlc291cmNlTG9hZGVyXCIsIFwiLi9TdWJFeGFtcGxlVmlldy5zY3NzXCJdLCBmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cywgUmVhY3QsIFZpZXdQbHVnaW5fMSwgUGx1Z2luc1Byb3ZpZGVyXzEsIFJlc291cmNlTG9hZGVyXzEpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4gICAgY2xhc3MgU3ViRXhhbXBsZUNvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJvcHMsIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgc3VwZXIocHJvcHMsIGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsXHJcbiAgICAgICAgICAgICAgICBcIlBsdWdpbnMgcHJvdmlkZXIgYXZhaWxhYmxlOiBcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5nZXRQbHVnaW5JbnN0YW5jZSA/IFwieWVzXCIgOiBcIm5vXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFN1YkV4YW1wbGVDb21wb25lbnQuY29udGV4dFR5cGUgPSBQbHVnaW5zUHJvdmlkZXJfMS5QbHVnaW5zQ29udGV4dDtcclxuICAgIGNsYXNzIFN1YkV4YW1wbGVWaWV3IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcm9wcywgY29udGV4dCkge1xyXG4gICAgICAgICAgICBzdXBlcihwcm9wcywgY29udGV4dCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZpZXdwbHVnaW4gPSBjb250ZXh0LmdldFBsdWdpbkluc3RhbmNlKFZpZXdQbHVnaW5fMS5kZWZhdWx0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXN5bmMgaW5pdGlhbGl6ZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHRpbWU6IFwiLVwiLFxyXG4gICAgICAgICAgICAgICAgZG90TmV0Q2FsbENvdW50OiAwLFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uQ2xpY2tzQ291bnQ6IDBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IHRpbWUgPSBhd2FpdCB0aGlzLnByb3BzLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHRpbWU6IHRpbWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxNZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShzID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG90TmV0Q2FsbENvdW50OiBzLmRvdE5ldENhbGxDb3VudCArIDFcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb21wb25lbnREaWRNb3VudCgpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3cGx1Z2luLm5vdGlmeVZpZXdMb2FkZWQoXCJTdWJFeGFtcGxlVmlld1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwid3JhcHBlclwiIH0sXHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmNvbnN0YW50TWVzc2FnZSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJiclwiLCBudWxsKSxcclxuICAgICAgICAgICAgICAgIFwiQ3VycmVudCB0aW1lICgrMWhyKTogXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnRpbWUsXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnJcIiwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnJcIiwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBcIkRvdCBuZXQgY2FsbHMgY291bnQ6IFwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5kb3ROZXRDYWxsQ291bnQsXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnJcIiwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBcIkJ1dHRvbiBjbGlja3MgY291bnQ6IFwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5idXR0b25DbGlja3NDb3VudCxcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJiclwiLCBudWxsKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoU3ViRXhhbXBsZUNvbXBvbmVudCwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnJcIiwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBcIkN1c3RvbSByZXNvdXJjZTpcIixcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVzb3VyY2VMb2FkZXJfMS5SZXNvdXJjZUxvYWRlci5Db25zdW1lciwgbnVsbCwgdXJsID0+IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiwgeyBzcmM6IHVybChcIkNvbXBsZXRlZC5wbmdcIiwgXCJzaXplPW5vcm1hbFwiKSB9KSksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnJcIiwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIiwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIsIHsgYWNjZXNzS2V5OiBcInpcIiwgb25DbGljazogKCkgPT4gdGhpcy5zZXRTdGF0ZShzID0+IHsgcmV0dXJuIHsgYnV0dG9uQ2xpY2tzQ291bnQ6IHMuYnV0dG9uQ2xpY2tzQ291bnQgKyAxIH07IH0pIH0sIFwiQ2xpY2sgbWUhXCIpLFxyXG4gICAgICAgICAgICAgICAgXCJcXHUwMEEwXCIpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBleHBvcnRzLmRlZmF1bHQgPSBTdWJFeGFtcGxlVmlldztcclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3dbXCJQbHVnaW5zUHJvdmlkZXJcIl07IH0oKSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvd1tcIlJlc291cmNlTG9hZGVyXCJdOyB9KCkpOyIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3dbXCJSZWFjdFwiXTsgfSgpKTsiXSwic291cmNlUm9vdCI6IiJ9