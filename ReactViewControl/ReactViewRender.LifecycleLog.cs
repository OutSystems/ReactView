// ---------------------------------------------------------------------------------------------------
// TEMPORARY DIAGNOSTIC INSTRUMENTATION - RDEV-10097 - DO NOT MERGE
//
// Observes the native object registration lifecycle to find out why still mounted child views end up
// with no native object. Logging only: no behaviour change, no state that anything else reads.
//
// To revert: delete this file, remove its <Compile Include> entry from ReactViewControl.Avalonia.csproj
// and remove every "Lifecycle" call site (grep for "Lifecycle" in ReactViewControl).
// ---------------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Threading;
using WebViewControl;

namespace ReactViewControl {

    partial class ReactViewRender {

        private const string LifecyclePrefix = "[RV-LIFECYCLE]";
        private const int LifecycleMaxJsSinkFailures = 20;

        // set RV_LIFECYCLE=0 to silence everything, RV_LIFECYCLE_DEVTOOLS=0 to keep only the host side sink
        private static readonly bool LifecycleEnabled = Environment.GetEnvironmentVariable("RV_LIFECYCLE") != "0";
        private static readonly bool LifecycleDevToolsEnabled = Environment.GetEnvironmentVariable("RV_LIFECYCLE_DEVTOOLS") != "0";

        private static long lifecycleSequence;
        private static int lifecycleRenderCounter;
        private static readonly Stopwatch LifecycleClock = Stopwatch.StartNew();

        private readonly int lifecycleRenderId = Interlocked.Increment(ref lifecycleRenderCounter);
        private readonly object lifecycleSyncRoot = new object();

        /// <summary>
        /// Mirrors what the webview native object registry is believed to hold, so a registration that the
        /// registry silently drops (it refuses a name that is already taken) and an unregistration that
        /// removes a name registered by a different frame generation become visible from here.
        /// </summary>
        private readonly Dictionary<string, LifecycleRegistration> lifecycleRegistrations = new Dictionary<string, LifecycleRegistration>();

        private readonly Dictionary<string, int> lifecycleFrameGenerations = new Dictionary<string, int>();
        private readonly ConditionalWeakTable<FrameInfo, LifecycleFrameTag> lifecycleFrameTags = new ConditionalWeakTable<FrameInfo, LifecycleFrameTag>();

        private int lifecycleJsSinkFailures;

        private class LifecycleRegistration {
            public long Sequence { get; set; }
            public int ThreadId { get; set; }
            public int FrameId { get; set; }
            public int FrameGeneration { get; set; }
            public int ModuleId { get; set; }
            public int NativeObjectId { get; set; }
        }

        private class LifecycleFrameTag {
            public int Generation { get; set; }
            public double CreatedAtMs { get; set; }
            public double LoadedAtMs { get; set; } = double.NaN;
        }

        private static int LifecycleIdOf(object value) {
            return value == null ? 0 : RuntimeHelpers.GetHashCode(value);
        }

        private LifecycleFrameTag GetLifecycleFrameTag(FrameInfo frame) {
            lock (lifecycleSyncRoot) {
                if (lifecycleFrameTags.TryGetValue(frame, out var tag)) {
                    return tag;
                }

                lifecycleFrameGenerations.TryGetValue(frame.Name, out var generation);
                generation++;
                lifecycleFrameGenerations[frame.Name] = generation;

                tag = new LifecycleFrameTag { Generation = generation, CreatedAtMs = LifecycleClock.Elapsed.TotalMilliseconds };
                lifecycleFrameTags.Add(frame, tag);
                return tag;
            }
        }

        /// <summary>
        /// Logs one lifecycle line. Never throws.
        /// Call sites that run outside SyncRoot must pass toDevTools: false, because reaching the devtools
        /// sink reads the frames of this render and those are only safe to read while holding the lock.
        /// </summary>
        private long LogLifecycle(string op, string frameName, string nativeObjectName, string detail = null, bool toDevTools = true) {
            var sequence = Interlocked.Increment(ref lifecycleSequence);
            if (!LifecycleEnabled) {
                return sequence;
            }

            try {
                var line = string.Format(
                    CultureInfo.InvariantCulture,
                    "{0} #{1:D6} t={2:F3} {3} thr={4} rv={5} op={6} frame='{7}' obj='{8}'{9}",
                    LifecyclePrefix,
                    sequence,
                    LifecycleClock.Elapsed.TotalMilliseconds,
                    DateTime.Now.ToString("HH:mm:ss.fff", CultureInfo.InvariantCulture),
                    Environment.CurrentManagedThreadId,
                    lifecycleRenderId,
                    op,
                    frameName ?? "<null>",
                    nativeObjectName ?? "-",
                    string.IsNullOrEmpty(detail) ? "" : " " + detail);

                WriteLifecycleToHost(line);
                if (toDevTools) {
                    WriteLifecycleToDevTools(line);
                }
            } catch (Exception) {
                // instrumentation must never affect the run it is observing
            }
            return sequence;
        }

        private long LogLifecycleFrame(string op, FrameInfo frame, string nativeObjectName = null, string detail = null) {
            var tag = GetLifecycleFrameTag(frame);
            var frameDetail = string.Format(
                CultureInfo.InvariantCulture,
                "frame#={0} gen={1} status={2} readyToLoad={3} component#={4}{5}",
                LifecycleIdOf(frame),
                tag.Generation,
                frame.LoadStatus,
                frame.IsComponentReadyToLoad,
                LifecycleIdOf(frame.Component),
                string.IsNullOrEmpty(detail) ? "" : " " + detail);

            return LogLifecycle(op, frame.Name, nativeObjectName, frameDetail);
        }

        private static void WriteLifecycleToHost(string line) {
            try {
                Console.WriteLine(line);
                Trace.WriteLine(line);
            } catch (Exception) {
                // a missing/closed stdout must not break the observed run
            }
        }

        /// <summary>
        /// Mirrors the line into the devtools console so it interleaves with the js side "Ignored call to"
        /// warnings. Only attempted while the main frame is ready: the teardown paths can run with no live
        /// v8 context and executing script there would be a needless risk. Those lines are host side only.
        /// </summary>
        private void WriteLifecycleToDevTools(string line) {
            if (!LifecycleDevToolsEnabled || lifecycleJsSinkFailures >= LifecycleMaxJsSinkFailures) {
                return;
            }

            try {
                if (WebView == null || WebView.IsDisposing || !IsReady) {
                    return;
                }

                WebView.ExecuteScript("console.warn(" + JavascriptSerializer.Serialize(line) + ")");
            } catch (Exception) {
                lifecycleJsSinkFailures++;
            }
        }

        /// <summary>
        /// Called right after handing the object to the webview, with what the webview answered:
        /// "True if the object was registered or false if the object was already registered before".
        /// A false answer is the dropped registration, and it leaves the just mounted view sharing the
        /// native object of the generation before it, whose frame is the one that will be torn down.
        /// </summary>
        private void TrackLifecycleRegistration(IViewModule module, FrameInfo frame, string nativeObjectName, object nativeObject, bool registeredInWebView) {
            try {
                var tag = GetLifecycleFrameTag(frame);
                var entry = new LifecycleRegistration {
                    ThreadId = Environment.CurrentManagedThreadId,
                    FrameId = LifecycleIdOf(frame),
                    FrameGeneration = tag.Generation,
                    ModuleId = LifecycleIdOf(module),
                    NativeObjectId = LifecycleIdOf(nativeObject)
                };

                LifecycleRegistration previous;
                lock (lifecycleSyncRoot) {
                    lifecycleRegistrations.TryGetValue(nativeObjectName, out previous);
                    if (registeredInWebView) {
                        lifecycleRegistrations[nativeObjectName] = entry;
                    }
                }

                var detail = string.Format(
                    CultureInfo.InvariantCulture,
                    "registered={0} module='{1}' nativeObj#={2}",
                    registeredInWebView,
                    module.Name,
                    entry.NativeObjectId);

                if (registeredInWebView) {
                    entry.Sequence = LogLifecycleFrame("REGISTER", frame, nativeObjectName, detail);
                    return;
                }

                entry.Sequence = LogLifecycleFrame(
                    "BUG-DUPLICATE-REGISTRATION",
                    frame,
                    nativeObjectName,
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "{0} droppedNativeObj#={1} keptNativeObj#={2} keptFrame#={3} keptGen={4} keptSeq={5} keptThr={6}",
                        detail,
                        entry.NativeObjectId,
                        previous == null ? "unknown" : previous.NativeObjectId.ToString(CultureInfo.InvariantCulture),
                        previous == null ? "unknown" : previous.FrameId.ToString(CultureInfo.InvariantCulture),
                        previous == null ? "unknown" : previous.FrameGeneration.ToString(CultureInfo.InvariantCulture),
                        previous == null ? "unknown" : "#" + previous.Sequence.ToString("D6", CultureInfo.InvariantCulture),
                        previous == null ? "unknown" : previous.ThreadId.ToString(CultureInfo.InvariantCulture)));
            } catch (Exception) {
                // instrumentation must never affect the run it is observing
            }
        }

        /// <summary>
        /// Called right before removing the name from the webview. Logs op=BUG-STALE-UNREGISTER when the name
        /// is held by a different frame generation than the one asking for its removal, which is the case
        /// where a late teardown takes away the object of a view that is still alive.
        /// </summary>
        private void TrackLifecycleUnregistration(IViewModule module, FrameInfo frame, string nativeObjectName, string reason) {
            try {
                LifecycleRegistration registered;
                lock (lifecycleSyncRoot) {
                    lifecycleRegistrations.TryGetValue(nativeObjectName, out registered);
                    // the registry removes purely by name, whoever asked
                    lifecycleRegistrations.Remove(nativeObjectName);
                }

                var detail = string.Format(
                    CultureInfo.InvariantCulture,
                    "reason={0} module='{1}' module#={2}",
                    reason,
                    module.Name,
                    LifecycleIdOf(module));

                if (registered == null) {
                    LogLifecycleFrame("UNREGISTER-UNKNOWN", frame, nativeObjectName, detail);
                    return;
                }

                if (registered.FrameId == LifecycleIdOf(frame)) {
                    LogLifecycleFrame(
                        "UNREGISTER",
                        frame,
                        nativeObjectName,
                        string.Format(CultureInfo.InvariantCulture, "{0} regSeq=#{1:D6} regNativeObj#={2} regModule#={3}", detail, registered.Sequence, registered.NativeObjectId, registered.ModuleId));
                    return;
                }

                LogLifecycleFrame(
                    "BUG-STALE-UNREGISTER",
                    frame,
                    nativeObjectName,
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "{0} killedFrame#={1} killedGen={2} killedNativeObj#={3} killedModule#={4} killedRegSeq=#{5:D6} killedRegThr={6}",
                        detail,
                        registered.FrameId,
                        registered.FrameGeneration,
                        registered.NativeObjectId,
                        registered.ModuleId,
                        registered.Sequence,
                        registered.ThreadId));
            } catch (Exception) {
                // instrumentation must never affect the run it is observing
            }
        }

        /// <summary>
        /// A destroy notification carries only the frame name, never the generation it was raised for, so a
        /// teardown of a remounted frame that is already loaded is the shape to watch for.
        /// </summary>
        private void TrackLifecycleViewDestroyed(FrameInfo frame) {
            try {
                var tag = GetLifecycleFrameTag(frame);
                var sinceLoad = double.IsNaN(tag.LoadedAtMs) ? -1 : LifecycleClock.Elapsed.TotalMilliseconds - tag.LoadedAtMs;
                var detail = string.Format(CultureInfo.InvariantCulture, "createdAt={0:F3} sinceLoad={1:F3} plugins={2}", tag.CreatedAtMs, sinceLoad, frame.Plugins.Length);

                if (tag.Generation > 1 && frame.LoadStatus == LoadStatus.Ready) {
                    LogLifecycleFrame("WARN-DESTROY-LIVE-REMOUNT", frame, null, detail);
                } else {
                    LogLifecycleFrame("VIEW-DESTROYED", frame, null, detail);
                }
            } catch (Exception) {
                // instrumentation must never affect the run it is observing
            }
        }

        private void TrackLifecycleViewLoaded(FrameInfo frame, string id) {
            try {
                GetLifecycleFrameTag(frame).LoadedAtMs = LifecycleClock.Elapsed.TotalMilliseconds;
                LogLifecycleFrame("VIEW-LOADED", frame, null, string.Format(CultureInfo.InvariantCulture, "viewId='{0}'", id));
            } catch (Exception) {
                // instrumentation must never affect the run it is observing
            }
        }
    }
}
