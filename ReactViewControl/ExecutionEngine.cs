﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using WebViewControl;

namespace ReactViewControl {

    internal class ExecutionEngine : IExecutionEngine {

        private bool isReady;
        private readonly ConcurrentDictionary<string, ITrackable> trackedObjects = new ConcurrentDictionary<string, ITrackable>();

        public ExecutionEngine(WebView webview, string frameName) {
            WebView = webview;
            FrameName = frameName;
        }

        private WebView WebView { get; }

        private string FrameName { get; }

        private ConcurrentQueue<Tuple<string, object[]>> PendingScripts { get; } = new ConcurrentQueue<Tuple<string, object[]>>();

        private string FormatMethodInvocation(IViewModule module, string methodCall) {
            return ReactViewRender.ModulesObjectName + "(\"" + FrameName + "\",\"" + module.Name + "\")." + methodCall;
        }

        public void ExecuteMethod(IViewModule module, string methodCall, params object[] args) {
            var method = FormatMethodInvocation(module, methodCall);
            if (isReady) {
                WebView.ExecuteScriptFunctionWithSerializedParams(method, args);
            } else {
                PendingScripts.Enqueue(Tuple.Create(method, args));
            }
        }

        public T EvaluateMethod<T>(IViewModule module, string methodCall, params object[] args) {
            var method = FormatMethodInvocation(module, methodCall);
            return WebView.EvaluateScriptFunctionWithSerializedParams<T>(method, args);
        }

        public void Start() {
            isReady = true;
            while (true) {
                if (PendingScripts.TryDequeue(out var pendingScript)) {
                    WebView.ExecuteScriptFunctionWithSerializedParams(pendingScript.Item1, pendingScript.Item2);
                } else {
                    // nothing else to execute
                    break;
                }
            }
        }

        public ConcreteType GetTrackedObject<ConcreteType>(ConcreteType trackable) where ConcreteType : ITrackable {
            if (trackable != null && trackedObjects.TryGetValue(trackable.trackId, out var obj)) {
                obj.Merge(trackable);
                return (ConcreteType) obj;
            }
            return trackable;
        }

        public TrackableType TrackObject<TrackableType>(TrackableType obj) where TrackableType : ITrackable {
            if (obj == null) {
                return default;
            }
            trackedObjects[obj.trackId] = obj;
            return obj;
        }

        public TrackableType[] TrackObject<TrackableType>(TrackableType[] objs) where TrackableType : ITrackable {
            if (objs == null) {
                return null;
            }
            var i = 0;
            var trackedObjs = new TrackableType[objs.Length];
            foreach (var obj in objs) {
                trackedObjs[i++] = TrackObject(obj);
            }
            return trackedObjs;
        }
    }
}
