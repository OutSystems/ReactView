window["Views"] = window["Views"] || {}; window["Views"]["PopupView"] =
(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["PopupView"],{

/***/ "./ExampleView/PopupView.tsx":
/*!***********************************!*\
  !*** ./ExampleView/PopupView.tsx ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! react */ "react")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, React) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PopupView extends React.Component {
        constructor() {
            super(...arguments);
            this.ref = React.createRef();
        }
        componentDidMount() {
            window.addEventListener("keydown", () => {
                this.ref.current.value += "keydown ";
            });
            this.props.loaded();
        }
        render() {
            return (React.createElement("input", { ref: this.ref, style: { width: "100px", height: "100px" }, autoFocus: true }));
        }
    }
    exports.default = PopupView;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["React"]; }());

/***/ })

},[["./ExampleView/PopupView.tsx","ViewsRuntime"]]]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9WaWV3cy8uL0V4YW1wbGVWaWV3L1BvcHVwVmlldy50c3giLCJ3ZWJwYWNrOi8vVmlld3MvZXh0ZXJuYWwgXCJSZWFjdFwiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpR0FBTyxDQUFDLG1CQUFTLEVBQUUsT0FBUyxFQUFFLHlDQUFPLENBQUMsbUNBQUU7QUFDeEM7QUFDQSxrREFBa0QsY0FBYztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCx3QkFBd0Isa0NBQWtDLG1CQUFtQjtBQUMvSDtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQUEsb0dBQUM7Ozs7Ozs7Ozs7OztBQ25CRixhQUFhLGtDQUFrQyxFQUFFLEkiLCJmaWxlIjoiR2VuZXJhdGVkL1BvcHVwVmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImRlZmluZShbXCJyZXF1aXJlXCIsIFwiZXhwb3J0c1wiLCBcInJlYWN0XCJdLCBmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cywgUmVhY3QpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4gICAgY2xhc3MgUG9wdXBWaWV3IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgdGhpcy5yZWYgPSBSZWFjdC5jcmVhdGVSZWYoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29tcG9uZW50RGlkTW91bnQoKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5jdXJyZW50LnZhbHVlICs9IFwia2V5ZG93biBcIjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMubG9hZGVkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIiwgeyByZWY6IHRoaXMucmVmLCBzdHlsZTogeyB3aWR0aDogXCIxMDBweFwiLCBoZWlnaHQ6IFwiMTAwcHhcIiB9LCBhdXRvRm9jdXM6IHRydWUgfSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGV4cG9ydHMuZGVmYXVsdCA9IFBvcHVwVmlldztcclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3dbXCJSZWFjdFwiXTsgfSgpKTsiXSwic291cmNlUm9vdCI6IiJ9