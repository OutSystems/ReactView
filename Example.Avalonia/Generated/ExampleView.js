window["Views"] = window["Views"] || {}; window["Views"]["ExampleView"] =
(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["ExampleView"],{

/***/ "./ExampleView/ExampleView.scss":
/*!**************************************!*\
  !*** ./ExampleView/ExampleView.scss ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin
module.exports = {"exportedVariable":"\"Some Fabulous Value!\""};

/***/ }),

/***/ "./ExampleView/ExampleView.tsx":
/*!*************************************!*\
  !*** ./ExampleView/ExampleView.tsx ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! react */ "react"), __webpack_require__(/*! ViewFrame */ "ViewFrame"), __webpack_require__(/*! ./ViewPlugin */ "./ExampleView/ViewPlugin.ts"), __webpack_require__(/*! ./ExampleView.scss */ "./ExampleView/ExampleView.scss"), __webpack_require__(/*! ./beach.jpg */ "./ExampleView/beach.jpg"), __webpack_require__(/*! ResourceLoader */ "ResourceLoader")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, React, ViewFrame_1, ViewPlugin_1, styles, Image, ResourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ImageKind;
    (function (ImageKind) {
        ImageKind[ImageKind["None"] = 0] = "None";
        ImageKind[ImageKind["Beach"] = 1] = "Beach";
    })(ImageKind = exports.ImageKind || (exports.ImageKind = {}));
    var SubViewShowStatus;
    (function (SubViewShowStatus) {
        SubViewShowStatus[SubViewShowStatus["Show"] = 0] = "Show";
        SubViewShowStatus[SubViewShowStatus["ShowWrapped"] = 1] = "ShowWrapped";
        SubViewShowStatus[SubViewShowStatus["Hide"] = 2] = "Hide";
    })(SubViewShowStatus || (SubViewShowStatus = {}));
    class ExampleView extends React.Component {
        constructor(props, context) {
            super(props, context);
            this.onMountSubViewClick = () => {
                let next = (this.state.subViewShowStatus + 1) % 3;
                if (next === SubViewShowStatus.Show) {
                    this.props.viewMounted();
                }
                this.setState({ subViewShowStatus: next });
            };
            this.initialize();
            this.viewplugin = context.getPluginInstance(ViewPlugin_1.default);
        }
        async initialize() {
            this.state = {
                time: "-",
                subViewShowStatus: SubViewShowStatus.Show
            };
            let time = await this.props.getTime();
            this.setState({ time: time });
        }
        callMe() {
            alert("React View says: clicked on a WPF button");
        }
        componentDidMount() {
            this.viewplugin.notifyViewLoaded("ExampleView");
            if (this.state.subViewShowStatus !== SubViewShowStatus.Hide) {
                this.props.viewMounted();
            }
        }
        renderViewFrame() {
            return React.createElement(ViewFrame_1.ViewFrame, { key: "test_frame", name: "SubView", className: "" });
        }
        renderSubView() {
            switch (this.state.subViewShowStatus) {
                case SubViewShowStatus.Show:
                    return React.createElement("div", null, this.renderViewFrame());
                case SubViewShowStatus.ShowWrapped:
                    return this.renderViewFrame();
                default:
                    return null;
            }
        }
        render() {
            return (React.createElement("div", { className: "wrapper" },
                this.props.constantMessage,
                React.createElement("br", null),
                "Current time: ",
                this.state.time,
                React.createElement("br", null),
                "This is a shared SASS varible value: '",
                styles.exportedVariable,
                "'",
                React.createElement("br", null),
                this.props.image === ImageKind.Beach ? React.createElement("img", { className: "image", src: Image }) : null,
                React.createElement("br", null),
                React.createElement("input", { onChange: () => this.props.inputChanged() }),
                React.createElement("div", { className: "buttons-bar" },
                    React.createElement("button", { accessKey: "c", onClick: () => { this.props.click(null); } }, "Click me!"),
                    "\u00A0",
                    React.createElement("button", { onClick: this.onMountSubViewClick }, "Mount/Wrap/Hide child view")),
                "Custom resource:",
                React.createElement(ResourceLoader_1.ResourceLoader.Consumer, null, url => React.createElement("img", { src: url("Ok.png") })),
                React.createElement("br", null),
                this.renderSubView()));
        }
    }
    exports.default = ExampleView;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ "./ExampleView/beach.jpg":
/*!*******************************!*\
  !*** ./ExampleView/beach.jpg ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "/Example.Avalonia/ExampleView/beach.jpg";

/***/ }),

/***/ "ResourceLoader":
/*!*********************************!*\
  !*** external "ResourceLoader" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["ResourceLoader"]; }());

/***/ }),

/***/ "ViewFrame":
/*!****************************!*\
  !*** external "ViewFrame" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["ViewFrame"]; }());

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["React"]; }());

/***/ })

},[["./ExampleView/ExampleView.tsx","ViewsRuntime","ExampleView~SubExampleView~ViewPlugin"]]]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9WaWV3cy8uL0V4YW1wbGVWaWV3L0V4YW1wbGVWaWV3LnNjc3M/ZjA4MiIsIndlYnBhY2s6Ly9WaWV3cy8uL0V4YW1wbGVWaWV3L0V4YW1wbGVWaWV3LnRzeCIsIndlYnBhY2s6Ly9WaWV3cy8uL0V4YW1wbGVWaWV3L2JlYWNoLmpwZyIsIndlYnBhY2s6Ly9WaWV3cy9leHRlcm5hbCBcIlJlc291cmNlTG9hZGVyXCIiLCJ3ZWJwYWNrOi8vVmlld3MvZXh0ZXJuYWwgXCJWaWV3RnJhbWVcIiIsIndlYnBhY2s6Ly9WaWV3cy9leHRlcm5hbCBcIlJlYWN0XCIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBO0FBQ0Esa0JBQWtCLCtDOzs7Ozs7Ozs7OztBQ0RsQixpR0FBTyxDQUFDLG1CQUFTLEVBQUUsT0FBUyxFQUFFLHlDQUFPLEVBQUUsaURBQVcsRUFBRSxzRUFBYyxFQUFFLCtFQUFvQixFQUFFLGlFQUFhLEVBQUUsMkRBQWdCLENBQUMsbUNBQUU7QUFDNUg7QUFDQSxrREFBa0QsY0FBYztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUssMERBQTBEO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLDhDQUE4QztBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLDBCQUEwQjtBQUN6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixhQUFhO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrREFBK0Qsb0RBQW9EO0FBQ25IO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCx1QkFBdUI7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUZBQW1GLGlDQUFpQztBQUNwSDtBQUNBLDhDQUE4Qyw0Q0FBNEM7QUFDMUYsNENBQTRDLDJCQUEyQjtBQUN2RSxtREFBbUQsaUNBQWlDLHdCQUF3QixFQUFFLEVBQUU7QUFDaEg7QUFDQSxtREFBbUQsb0NBQW9DO0FBQ3ZGO0FBQ0EsdUhBQXVILHFCQUFxQjtBQUM1STtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUFBLG9HQUFDOzs7Ozs7Ozs7Ozs7QUNsRkYsMkQ7Ozs7Ozs7Ozs7O0FDQUEsYUFBYSwyQ0FBMkMsRUFBRSxJOzs7Ozs7Ozs7OztBQ0ExRCxhQUFhLHNDQUFzQyxFQUFFLEk7Ozs7Ozs7Ozs7O0FDQXJELGFBQWEsa0NBQWtDLEVBQUUsSSIsImZpbGUiOiJHZW5lcmF0ZWQvRXhhbXBsZVZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbm1vZHVsZS5leHBvcnRzID0ge1wiZXhwb3J0ZWRWYXJpYWJsZVwiOlwiXFxcIlNvbWUgRmFidWxvdXMgVmFsdWUhXFxcIlwifTsiLCJkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIiwgXCJyZWFjdFwiLCBcIlZpZXdGcmFtZVwiLCBcIi4vVmlld1BsdWdpblwiLCBcIi4vRXhhbXBsZVZpZXcuc2Nzc1wiLCBcIi4vYmVhY2guanBnXCIsIFwiUmVzb3VyY2VMb2FkZXJcIl0sIGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBSZWFjdCwgVmlld0ZyYW1lXzEsIFZpZXdQbHVnaW5fMSwgc3R5bGVzLCBJbWFnZSwgUmVzb3VyY2VMb2FkZXJfMSkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbiAgICB2YXIgSW1hZ2VLaW5kO1xyXG4gICAgKGZ1bmN0aW9uIChJbWFnZUtpbmQpIHtcclxuICAgICAgICBJbWFnZUtpbmRbSW1hZ2VLaW5kW1wiTm9uZVwiXSA9IDBdID0gXCJOb25lXCI7XHJcbiAgICAgICAgSW1hZ2VLaW5kW0ltYWdlS2luZFtcIkJlYWNoXCJdID0gMV0gPSBcIkJlYWNoXCI7XHJcbiAgICB9KShJbWFnZUtpbmQgPSBleHBvcnRzLkltYWdlS2luZCB8fCAoZXhwb3J0cy5JbWFnZUtpbmQgPSB7fSkpO1xyXG4gICAgdmFyIFN1YlZpZXdTaG93U3RhdHVzO1xyXG4gICAgKGZ1bmN0aW9uIChTdWJWaWV3U2hvd1N0YXR1cykge1xyXG4gICAgICAgIFN1YlZpZXdTaG93U3RhdHVzW1N1YlZpZXdTaG93U3RhdHVzW1wiU2hvd1wiXSA9IDBdID0gXCJTaG93XCI7XHJcbiAgICAgICAgU3ViVmlld1Nob3dTdGF0dXNbU3ViVmlld1Nob3dTdGF0dXNbXCJTaG93V3JhcHBlZFwiXSA9IDFdID0gXCJTaG93V3JhcHBlZFwiO1xyXG4gICAgICAgIFN1YlZpZXdTaG93U3RhdHVzW1N1YlZpZXdTaG93U3RhdHVzW1wiSGlkZVwiXSA9IDJdID0gXCJIaWRlXCI7XHJcbiAgICB9KShTdWJWaWV3U2hvd1N0YXR1cyB8fCAoU3ViVmlld1Nob3dTdGF0dXMgPSB7fSkpO1xyXG4gICAgY2xhc3MgRXhhbXBsZVZpZXcgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByb3BzLCBjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKHByb3BzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgdGhpcy5vbk1vdW50U3ViVmlld0NsaWNrID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSAodGhpcy5zdGF0ZS5zdWJWaWV3U2hvd1N0YXR1cyArIDEpICUgMztcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0ID09PSBTdWJWaWV3U2hvd1N0YXR1cy5TaG93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy52aWV3TW91bnRlZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHN1YlZpZXdTaG93U3RhdHVzOiBuZXh0IH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemUoKTtcclxuICAgICAgICAgICAgdGhpcy52aWV3cGx1Z2luID0gY29udGV4dC5nZXRQbHVnaW5JbnN0YW5jZShWaWV3UGx1Z2luXzEuZGVmYXVsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFzeW5jIGluaXRpYWxpemUoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aW1lOiBcIi1cIixcclxuICAgICAgICAgICAgICAgIHN1YlZpZXdTaG93U3RhdHVzOiBTdWJWaWV3U2hvd1N0YXR1cy5TaG93XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxldCB0aW1lID0gYXdhaXQgdGhpcy5wcm9wcy5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyB0aW1lOiB0aW1lIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYWxsTWUoKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiUmVhY3QgVmlldyBzYXlzOiBjbGlja2VkIG9uIGEgV1BGIGJ1dHRvblwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29tcG9uZW50RGlkTW91bnQoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld3BsdWdpbi5ub3RpZnlWaWV3TG9hZGVkKFwiRXhhbXBsZVZpZXdcIik7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLnN1YlZpZXdTaG93U3RhdHVzICE9PSBTdWJWaWV3U2hvd1N0YXR1cy5IaWRlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnZpZXdNb3VudGVkKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmVuZGVyVmlld0ZyYW1lKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChWaWV3RnJhbWVfMS5WaWV3RnJhbWUsIHsga2V5OiBcInRlc3RfZnJhbWVcIiwgbmFtZTogXCJTdWJWaWV3XCIsIGNsYXNzTmFtZTogXCJcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVuZGVyU3ViVmlldygpIHtcclxuICAgICAgICAgICAgc3dpdGNoICh0aGlzLnN0YXRlLnN1YlZpZXdTaG93U3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFN1YlZpZXdTaG93U3RhdHVzLlNob3c6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCwgdGhpcy5yZW5kZXJWaWV3RnJhbWUoKSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFN1YlZpZXdTaG93U3RhdHVzLlNob3dXcmFwcGVkOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbmRlclZpZXdGcmFtZSgpO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ3cmFwcGVyXCIgfSxcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuY29uc3RhbnRNZXNzYWdlLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImJyXCIsIG51bGwpLFxyXG4gICAgICAgICAgICAgICAgXCJDdXJyZW50IHRpbWU6IFwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS50aW1lLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImJyXCIsIG51bGwpLFxyXG4gICAgICAgICAgICAgICAgXCJUaGlzIGlzIGEgc2hhcmVkIFNBU1MgdmFyaWJsZSB2YWx1ZTogJ1wiLFxyXG4gICAgICAgICAgICAgICAgc3R5bGVzLmV4cG9ydGVkVmFyaWFibGUsXHJcbiAgICAgICAgICAgICAgICBcIidcIixcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJiclwiLCBudWxsKSxcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuaW1hZ2UgPT09IEltYWdlS2luZC5CZWFjaCA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiwgeyBjbGFzc05hbWU6IFwiaW1hZ2VcIiwgc3JjOiBJbWFnZSB9KSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnJcIiwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIiwgeyBvbkNoYW5nZTogKCkgPT4gdGhpcy5wcm9wcy5pbnB1dENoYW5nZWQoKSB9KSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiYnV0dG9ucy1iYXJcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIiwgeyBhY2Nlc3NLZXk6IFwiY1wiLCBvbkNsaWNrOiAoKSA9PiB7IHRoaXMucHJvcHMuY2xpY2sobnVsbCk7IH0gfSwgXCJDbGljayBtZSFcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJcXHUwMEEwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiLCB7IG9uQ2xpY2s6IHRoaXMub25Nb3VudFN1YlZpZXdDbGljayB9LCBcIk1vdW50L1dyYXAvSGlkZSBjaGlsZCB2aWV3XCIpKSxcclxuICAgICAgICAgICAgICAgIFwiQ3VzdG9tIHJlc291cmNlOlwiLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChSZXNvdXJjZUxvYWRlcl8xLlJlc291cmNlTG9hZGVyLkNvbnN1bWVyLCBudWxsLCB1cmwgPT4gUmVhY3QuY3JlYXRlRWxlbWVudChcImltZ1wiLCB7IHNyYzogdXJsKFwiT2sucG5nXCIpIH0pKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJiclwiLCBudWxsKSxcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyU3ViVmlldygpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZXhwb3J0cy5kZWZhdWx0ID0gRXhhbXBsZVZpZXc7XHJcbn0pO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFwiL0V4YW1wbGUuQXZhbG9uaWEvRXhhbXBsZVZpZXcvYmVhY2guanBnXCI7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvd1tcIlJlc291cmNlTG9hZGVyXCJdOyB9KCkpOyIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3dbXCJWaWV3RnJhbWVcIl07IH0oKSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvd1tcIlJlYWN0XCJdOyB9KCkpOyJdLCJzb3VyY2VSb290IjoiIn0=