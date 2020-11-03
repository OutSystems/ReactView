(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["ExampleView~SubExampleView~ViewPlugin"],{

/***/ "./ExampleView/ViewPlugin.ts":
/*!***********************************!*\
  !*** ./ExampleView/ViewPlugin.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    console.log("Plugin loaded");
    class ViewPlugin {
        constructor(nativeObject) {
            this.nativeObject = nativeObject;
        }
        notifyViewLoaded(viewName) {
            this.nativeObject.notifyViewLoaded(viewName);
        }
        test() {
            alert("test called");
        }
    }
    exports.default = ViewPlugin;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9WaWV3cy8uL0V4YW1wbGVWaWV3L1ZpZXdQbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaUdBQU8sQ0FBQyxtQkFBUyxFQUFFLE9BQVMsQ0FBQyxtQ0FBRTtBQUMvQjtBQUNBLGtEQUFrRCxjQUFjO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUFBLG9HQUFDIiwiZmlsZSI6IkdlbmVyYXRlZC9jaHVua18wZDk2ZGY2MS5qcyIsInNvdXJjZXNDb250ZW50IjpbImRlZmluZShbXCJyZXF1aXJlXCIsIFwiZXhwb3J0c1wiXSwgZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4gICAgY29uc29sZS5sb2coXCJQbHVnaW4gbG9hZGVkXCIpO1xyXG4gICAgY2xhc3MgVmlld1BsdWdpbiB7XHJcbiAgICAgICAgY29uc3RydWN0b3IobmF0aXZlT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMubmF0aXZlT2JqZWN0ID0gbmF0aXZlT2JqZWN0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBub3RpZnlWaWV3TG9hZGVkKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmF0aXZlT2JqZWN0Lm5vdGlmeVZpZXdMb2FkZWQodmlld05hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXN0KCkge1xyXG4gICAgICAgICAgICBhbGVydChcInRlc3QgY2FsbGVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGV4cG9ydHMuZGVmYXVsdCA9IFZpZXdQbHVnaW47XHJcbn0pO1xyXG4iXSwic291cmNlUm9vdCI6IiJ9