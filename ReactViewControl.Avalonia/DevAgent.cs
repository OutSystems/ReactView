using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Controls.Diagnostics;
using Avalonia.Controls.Primitives;
using Avalonia.LogicalTree;
using Avalonia.Input;
using Avalonia.Input.Raw;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Avalonia.VisualTree;

namespace ReactViewControl {

    /// <summary>
    /// Dev mode only (the application loads its views from the dev server): a local http endpoint for the tools that
    /// drive the application (the ReactView MCP server), covering what the DevTools protocol of the views does not see,
    /// the native windows around them: the windows, their visual tree, screenshots of a window or of one of its
    /// controls, raising a window, mouse and keyboard input into a window. Listens on 127.0.0.1:REACTVIEW_AGENT_PORT (default 9223); 0 disables it.
    /// </summary>
    internal static class DevAgent {

        private const int DefaultPort = 9223;

        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions() {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            // a tree node nests two levels per depth level
            MaxDepth = 512
        };

        private static HttpListener listener;

        public static void Start() {
            if (listener != null) {
                return;
            }
            var port = int.TryParse(Environment.GetEnvironmentVariable("REACTVIEW_AGENT_PORT"), out var configuredPort) ? configuredPort : DefaultPort;
            if (port <= 0) {
                return;
            }
            var newListener = new HttpListener();
            newListener.Prefixes.Add($"http://127.0.0.1:{port}/");
            try {
                newListener.Start();
            } catch (Exception e) {
                Console.Error.WriteLine($"[ReactView] The native agent could not listen on port {port}: {e.Message}");
                return;
            }
            listener = newListener;
            Task.Run(Serve);
        }

        private static async Task Serve() {
            while (listener.IsListening) {
                HttpListenerContext context;
                try {
                    context = await listener.GetContextAsync();
                } catch (Exception) when (!listener.IsListening) {
                    return;
                }
                _ = Task.Run(() => Handle(context));
            }
        }

        private static async Task Handle(HttpListenerContext context) {
            var response = context.Response;
            var query = context.Request.QueryString;
            try {
                switch (context.Request.Url?.AbsolutePath) {
                    case "/windows":
                        WriteJson(response, await OnUIThread(() => Windows().Select(Describe).ToArray()));
                        break;
                    case "/tree":
                        WriteJson(response, await OnUIThread(() => Tree(query)));
                        break;
                    case "/activate":
                        WriteJson(response, await OnUIThread(() => Activate(query)));
                        break;
                    case "/click":
                        WriteJson(response, await OnUIThread(() => Click(query)));
                        break;
                    case "/key":
                        WriteJson(response, await OnUIThread(() => Key(query)));
                        break;
                    case "/text":
                        WriteJson(response, await OnUIThread(() => Text(query)));
                        break;
                    case "/screenshot":
                        var pages = PagesOf(context.Request);
                        WritePng(response, await OnUIThread(() => Screenshot(query, pages)));
                        break;
                    default:
                        response.StatusCode = (int)HttpStatusCode.NotFound;
                        WriteText(response, "unknown path: /windows, /activate?window=, /tree?window=&name=&type=&text=&depth=, /click?window=&x=&y=|name=&type=&text=&button=&count=&modifiers=, /key?window=&key=&modifiers=, /text?window=&text=, /screenshot?window=&name=&type=&text=&scale= (POST { pages: { id: png base64 } })");
                        break;
                }
            } catch (Exception e) {
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                WriteText(response, e.Message);
            } finally {
                response.Close();
            }
        }

        private static Task<T> OnUIThread<T>(Func<T> function) => Dispatcher.UIThread.InvokeAsync(function).GetTask();

        /// <summary>The visible windows, the active one first.</summary>
        private static List<Window> Windows() {
            var lifetime = Application.Current?.ApplicationLifetime as IClassicDesktopStyleApplicationLifetime;
            var windows = lifetime?.Windows.Where(w => w.IsVisible).ToList() ?? new List<Window>();
            return windows.OrderByDescending(w => w.IsActive).ToList();
        }

        private static Window WindowOf(NameValueCollection query) {
            var windows = Windows();
            var specification = query["window"];
            var window = string.IsNullOrEmpty(specification) ? windows.FirstOrDefault()
                : int.TryParse(specification, out var index) ? windows.ElementAtOrDefault(index)
                : windows.FirstOrDefault(w => (w.Title ?? "").Contains(specification, StringComparison.OrdinalIgnoreCase));
            return window ?? throw new InvalidOperationException($"no window '{specification}': {string.Join(", ", windows.Select(w => $"{windows.IndexOf(w)} '{w.Title}'"))}");
        }

        /// <summary>
        /// The control the request names (name=, type=, text=: the control showing that text, or with type= its closest
        /// ancestor of that type, e.g. the MenuItem whose header is the text), the window itself when it names none.
        /// The open popups of the window (menus, flyouts, combo box lists) are searched too.
        /// </summary>
        private static Visual ControlOf(Window window, NameValueCollection query) {
            var name = query["name"];
            var type = query["type"];
            var text = query["text"];
            if (string.IsNullOrEmpty(name) && string.IsNullOrEmpty(type) && string.IsNullOrEmpty(text)) {
                return window;
            }
            var candidates = Descendants(window).Where(v => v.IsEffectivelyVisible);
            var control = string.IsNullOrEmpty(text)
                ? candidates.FirstOrDefault(v => Matches(v, name, type))
                : candidates.Where(v => (TextOf(v) ?? "").Trim() == text.Trim()).Select(v => v.GetSelfAndVisualAncestors().FirstOrDefault(a => Matches(a, name, type))).FirstOrDefault(v => v != null);
            return control ?? throw new InvalidOperationException($"no visible control with name '{name}' / type '{type}' / text '{text}' in window '{window.Title}'");
        }

        private static bool Matches(Visual visual, string name, string type) =>
            (string.IsNullOrEmpty(name) || (visual as Control)?.Name == name) && (string.IsNullOrEmpty(type) || visual.GetType().Name == type);

        /// <summary>The visual descendants of a root, the contents of its open popups included (recursively).</summary>
        private static IEnumerable<Visual> Descendants(Visual root) => Descendants(root, new HashSet<Visual> { root });

        private static IEnumerable<Visual> Descendants(Visual root, HashSet<Visual> visited) {
            foreach (var visual in root.GetVisualDescendants()) {
                yield return visual;
            }
            // a popup's content provides the popup it is shown in: visited keeps that from recursing
            foreach (var popupRoot in PopupRoots(root).Where(visited.Add)) {
                yield return popupRoot;
                foreach (var inner in Descendants(popupRoot, visited)) {
                    yield return inner;
                }
            }
        }

        /// <summary>
        /// The open popups of a root: those of its visual descendants, and those of controls only in its logical tree
        /// (the context menu of a control that is not displayed, as Studio's view adapters attach theirs).
        /// </summary>
        private static List<PopupRoot> PopupRoots(Visual root) =>
            root.GetVisualDescendants().Concat(root.GetLogicalDescendants().OfType<Visual>()).Distinct().SelectMany(PopupRootsOf).Distinct().ToList();

        /// <summary>The open popups of a root whose owner is not a visual descendant of it: shown under the root's node.</summary>
        private static List<PopupRoot> OrphanPopupRoots(Visual root) =>
            PopupRoots(root).Except(root.GetVisualDescendants().SelectMany(PopupRootsOf)).ToList();

        /// <summary>
        /// The open popups a visual shows: a Popup's own, the context menu of a control, the flyout attached to it or
        /// set on a button, its tooltip. None of those but the Popup is a visual child of anything.
        /// </summary>
        private static IEnumerable<PopupRoot> PopupRootsOf(Visual visual) {
            var providers = new List<object> { visual };
            if (visual is Control control) {
                providers.Add(control.ContextMenu);
                providers.Add(FlyoutBase.GetAttachedFlyout(control));
                providers.Add(ToolTip.GetTip(control) as ToolTip);
                providers.Add(control.GetType().GetProperty("Flyout")?.GetValue(control));
            }
            // the content of a popup (a context menu, a flyout presenter) provides the popup it is shown in: not a popup of its own
            var own = TopLevel.GetTopLevel(visual);
            return providers.OfType<IPopupHostProvider>().Select(p => p.PopupHost as PopupRoot).Where(r => r != null && r.IsVisible && r != own).Distinct();
        }

        private static PopupRoot PopupRootOf(Popup popup) => popup.IsOpen ? popup.Host as PopupRoot : null;

        /// <summary>The window the visual is shown in (its own top level, a popup root for the contents of a popup).</summary>
        private static TopLevel TopLevelOf(Visual visual) => TopLevel.GetTopLevel(visual) ?? throw new InvalidOperationException("the control is not shown");

        /// <summary>
        /// Where a top level sits relative to the window, in device independent pixels: zero for the window itself, the
        /// offset of a popup root (its own native window) otherwise.
        /// </summary>
        private static Vector OffsetOf(TopLevel topLevel, Window window) {
            if (topLevel == window) {
                return default;
            }
            var offset = topLevel.PointToScreen(new Point()) - window.PointToScreen(new Point());
            return new Vector(offset.X / window.RenderScaling, offset.Y / window.RenderScaling);
        }

        /// <summary>The open popups shown over the window, outermost first, with where each one sits relative to the window.</summary>
        private static List<(PopupRoot root, Vector offset)> Popups(Window window) =>
            Descendants(window).OfType<PopupRoot>().Distinct().Select(root => (root, OffsetOf(root, window))).ToList();

        private static object Describe(Window window, int index) => new {
            index,
            window.Title,
            type = window.GetType().Name,
            width = window.ClientSize.Width,
            height = window.ClientSize.Height,
            scaling = window.RenderScaling,
            active = window.IsActive,
            pages = Views(window).Select(v => new { id = v.PageId, area = AreaOf(v, window) }).Select(v => new { v.id, x = v.area.X, y = v.area.Y, width = v.area.Width, height = v.area.Height }).ToArray()
        };

        /// <summary>The views shown in the window, with the page each one renders in.</summary>
        private static List<ReactViewRender> Views(Window window) =>
            window.GetVisualDescendants().OfType<ReactViewRender>().Where(v => v.IsEffectivelyVisible && v.Bounds.Width > 0 && v.Bounds.Height > 0).ToList();

        /// <summary>The area of a control relative to the window, for controls in the window's popups too.</summary>
        private static Rect AreaOf(Visual visual, Window window) {
            var topLevel = TopLevelOf(visual);
            var origin = (visual.TranslatePoint(new Point(), topLevel) ?? new Point()) + OffsetOf(topLevel, window);
            return new Rect(origin, visual.Bounds.Size);
        }

        /// <summary>
        /// Brings the window to the front: the webviews are native views, their pages stop producing frames (and
        /// answering screenshot requests) while the window is covered by others.
        /// </summary>
        private static object Activate(NameValueCollection query) {
            var window = WindowOf(query);
            if (window.WindowState == WindowState.Minimized) {
                window.WindowState = WindowState.Normal;
            }
            window.Activate();
            return new { activated = window.Title };
        }

        private static ulong Timestamp => (ulong)Environment.TickCount64;

        /// <summary>
        /// A mouse click into the window, injected where the platform's events enter Avalonia (the way the headless
        /// platform does it): at x=,y= in device independent pixels relative to the window's client area, or at the
        /// center of the control name= / type= / text= names (see ControlOf). button= left (default), right or middle; count= clicks (2 for a
        /// double click); modifiers= a comma separated list of Control, Shift, Alt, Meta. Only the Avalonia controls
        /// see it: the web views are native views, input into them goes through the DevTools protocol.
        /// </summary>
        private static object Click(NameValueCollection query) {
            var window = WindowOf(query);
            var position = PositionOf(window, query);
            var button = (query["button"] ?? "left").ToLowerInvariant();
            var count = int.TryParse(query["count"], out var requestedCount) ? Math.Max(1, requestedCount) : 1;
            var modifiers = ModifiersOf(query);
            var (down, up, held) = button switch {
                "left" => (RawPointerEventType.LeftButtonDown, RawPointerEventType.LeftButtonUp, RawInputModifiers.LeftMouseButton),
                "right" => (RawPointerEventType.RightButtonDown, RawPointerEventType.RightButtonUp, RawInputModifiers.RightMouseButton),
                "middle" => (RawPointerEventType.MiddleButtonDown, RawPointerEventType.MiddleButtonUp, RawInputModifiers.MiddleMouseButton),
                _ => throw new InvalidOperationException($"unknown button '{button}': left, right, middle")
            };
            // an open popup (menu, flyout) is its own native window: the click goes to the innermost one under the point
            var (root, offset) = Popups(window).LastOrDefault(p => new Rect(p.offset.X, p.offset.Y, p.root.Bounds.Width, p.root.Bounds.Height).Contains(position)) is var popup && popup.root != null
                ? ((TopLevel)popup.root, popup.offset) : (window, default);
            var local = position - offset;
            // posted: the handler of the click may run a nested loop (a modal dialog) that would hold the request
            Dispatcher.UIThread.Post(() => {
                Pointer(root, RawPointerEventType.Move, local, modifiers);
                for (var i = 0; i < count; i++) {
                    Pointer(root, down, local, modifiers | held);
                    Pointer(root, up, local, modifiers);
                }
            }, DispatcherPriority.Input);
            return new { clicked = button, x = position.X, y = position.Y, count, window = window.Title, popup = root == window ? null : root.GetType().Name };
        }

        private static void Pointer(TopLevel root, RawPointerEventType type, Point position, RawInputModifiers modifiers) =>
            RawInput.Process(RawInput.Create<RawPointerEventArgs>(RawInput.Mouse, Timestamp, root, type, position, modifiers));

        private static Point PositionOf(Window window, NameValueCollection query) {
            var hasX = double.TryParse(query["x"], NumberStyles.Float, CultureInfo.InvariantCulture, out var x);
            var hasY = double.TryParse(query["y"], NumberStyles.Float, CultureInfo.InvariantCulture, out var y);
            if (hasX && hasY) {
                return new Point(x, y);
            }
            var control = ControlOf(window, query);
            if (control == window) {
                throw new InvalidOperationException("where: x= and y=, or the control's name= / type= / text=");
            }
            return AreaOf(control, window).Center;
        }

        private static RawInputModifiers ModifiersOf(NameValueCollection query) {
            var modifiers = RawInputModifiers.None;
            foreach (var name in (query["modifiers"] ?? "").Split(new[] { ',', ' ', '+' }, StringSplitOptions.RemoveEmptyEntries)) {
                modifiers |= Enum.TryParse<RawInputModifiers>(name, true, out var modifier) ? modifier : throw new InvalidOperationException($"unknown modifier '{name}': Control, Shift, Alt, Meta");
            }
            return modifiers;
        }

        /// <summary>
        /// A key press (down then up) into the window: key= an Avalonia.Input.Key name (Enter, Escape, Tab, F2, A, ...),
        /// modifiers= as for /click. Goes to the focused control, so the window is activated first when it is not.
        /// </summary>
        private static object Key(NameValueCollection query) {
            var window = WindowOf(query);
            var key = Enum.TryParse<Avalonia.Input.Key>(query["key"], true, out var parsed) ? parsed : throw new InvalidOperationException($"unknown key '{query["key"]}': an Avalonia.Input.Key name, e.g. Enter, Escape, Tab, Down, F2, A");
            var modifiers = ModifiersOf(query);
            EnsureActive(window);
            Dispatcher.UIThread.Post(() => {
                RawInput.Process(RawInput.Create<RawKeyEventArgs>(RawInput.Keyboard, Timestamp, window, RawKeyEventType.KeyDown, key, modifiers));
                RawInput.Process(RawInput.Create<RawKeyEventArgs>(RawInput.Keyboard, Timestamp, window, RawKeyEventType.KeyUp, key, modifiers));
            }, DispatcherPriority.Input);
            return new { pressed = key.ToString(), modifiers = modifiers.ToString(), window = window.Title };
        }

        /// <summary>Text input (text=) into the focused control of the window, as typing it would produce.</summary>
        private static object Text(NameValueCollection query) {
            var window = WindowOf(query);
            var text = query["text"] ?? throw new InvalidOperationException("text= missing");
            EnsureActive(window);
            Dispatcher.UIThread.Post(() => RawInput.Process(RawInput.Create<RawTextInputEventArgs>(RawInput.Keyboard, Timestamp, window, text)), DispatcherPriority.Input);
            return new { typed = text, window = window.Title };
        }

        private static void EnsureActive(Window window) {
            if (!window.IsActive) {
                window.Activate();
            }
        }

        /// <summary>
        /// Avalonia's raw input entry point, the one the platforms (and the headless platform) feed: public in the
        /// runtime assemblies, hidden by the reference assemblies the package compiles against, hence reflection.
        /// </summary>
        private static class RawInput {

            private static readonly Assembly Base = typeof(RawInputEventArgs).Assembly;

            private static readonly object Manager = Base.GetType("Avalonia.Input.InputManager")?.GetProperty("Instance", BindingFlags.Public | BindingFlags.Static)?.GetValue(null)
                ?? throw new InvalidOperationException("Avalonia.Input.InputManager.Instance not found");

            private static readonly MethodInfo ProcessInput = Manager.GetType().GetMethod("ProcessInput", new[] { typeof(RawInputEventArgs) })
                ?? throw new InvalidOperationException("InputManager.ProcessInput not found");

            public static readonly object Mouse = Create<MouseDevice>(new object[] { null });

            public static object Keyboard => Service(typeof(IKeyboardDevice)) ?? throw new InvalidOperationException("no keyboard device registered");

            /// <summary>AvaloniaLocator.Current.GetService(type): the keyboard device the platform registered (the one that tracks the focus).</summary>
            private static object Service(Type type) {
                var locator = typeof(AvaloniaLocator).GetProperty("Current", BindingFlags.Public | BindingFlags.Static)?.GetValue(null)
                    ?? throw new InvalidOperationException("AvaloniaLocator.Current not found");
                return locator.GetType().GetMethod("GetService", new[] { typeof(Type) })?.Invoke(locator, new object[] { type });
            }

            public static void Process(RawInputEventArgs args) => ProcessInput.Invoke(Manager, new object[] { args });

            public static T Create<T>(params object[] arguments) {
                var constructor = typeof(T).GetConstructors().FirstOrDefault(c => c.GetParameters().Length == arguments.Length)
                    ?? throw new InvalidOperationException($"{typeof(T).Name} has no constructor with {arguments.Length} parameters");
                return (T)constructor.Invoke(arguments);
            }
        }

        private static object Tree(NameValueCollection query) {
            var window = WindowOf(query);
            var root = ControlOf(window, query);
            var maxDepth = int.TryParse(query["depth"], out var depth) ? depth : 100;
            return Node(root, window, maxDepth);
        }

        private static object Node(Visual visual, Window window, int depth) {
            var area = AreaOf(visual, window);
            var popupRoots = PopupRootsOf(visual).Concat(visual is Window ? OrphanPopupRoots(visual) : Enumerable.Empty<PopupRoot>()).ToArray();
            return new {
                type = visual.GetType().Name,
                name = string.IsNullOrEmpty((visual as Control)?.Name) ? null : ((Control)visual).Name,
                classes = (visual as StyledElement)?.Classes.Count > 0 ? string.Join(" ", ((StyledElement)visual).Classes) : null,
                text = TextOf(visual),
                page = (visual as ReactViewRender)?.PageId,
                x = Math.Round(area.X, 1),
                y = Math.Round(area.Y, 1),
                width = Math.Round(area.Width, 1),
                height = Math.Round(area.Height, 1),
                visible = visual.IsEffectivelyVisible ? (bool?)null : false,
                open = popupRoots.Length > 0 ? (bool?)true : null,
                contextMenu = (visual as Control)?.ContextMenu is ContextMenu contextMenu ? new { contextMenu.IsOpen, items = contextMenu.ItemCount, host = (contextMenu as IPopupHostProvider).PopupHost?.GetType().Name } : null,
                // the subtree of a hidden control is noise, so is the one below the requested depth; an open popup's
                // contents (its own native window) show as its children, placed relative to the window
                children = depth > 0 && visual.IsEffectivelyVisible ? popupRoots.Concat(visual is Popup ? Enumerable.Empty<Visual>() : visual.GetVisualChildren()).Select(c => Node(c, window, depth - 1)).ToArray() : null
            };
        }

        private static string TextOf(Visual visual) {
            switch (visual) {
                case TextBlock textBlock:
                    return textBlock.Text;
                case TextBox textBox:
                    return textBox.Text;
                case ContentControl contentControl when contentControl.Content is string content:
                    return content;
                case HeaderedSelectingItemsControl headered when headered.Header is string header:
                    return header;
                case HeaderedContentControl headered when headered.Header is string header:
                    return header;
                case HeaderedItemsControl headered when headered.Header is string header:
                    return header;
                default:
                    return null;
            }
        }

        /// <summary>
        /// PNG of the window, or of one of its controls (name=, type=), at scale= times the window's render scaling.
        /// The whole window is rendered and the control's area cut out of it, so the control shows as it does on
        /// screen, with whatever overlaps it. The webviews do not render into a bitmap (they paint on their own):
        /// their pages come from the caller, captured through the DevTools protocol, as the pages of the request body
        /// (PNG, base64, by page id, see /windows), and are drawn where the views are.
        /// </summary>
        private static byte[] Screenshot(NameValueCollection query, Dictionary<string, byte[]> pages) {
            var window = WindowOf(query);
            var control = ControlOf(window, query);
            var scale = double.TryParse(query["scale"], NumberStyles.Float, CultureInfo.InvariantCulture, out var requestedScale) ? requestedScale : 1;
            var scaling = window.RenderScaling * scale;
            var dpi = new Vector(96 * scaling, 96 * scaling);
            var area = control == window ? new Rect(window.ClientSize) : AreaOf(control, window);

            using (var rendered = new RenderTargetBitmap(PixelSizeOf(window.ClientSize, scaling), dpi)) {
                rendered.Render(window);
                using (var composed = new RenderTargetBitmap(PixelSizeOf(area.Size, scaling), dpi)) {
                    using (var drawingContext = composed.CreateDrawingContext()) {
                        drawingContext.DrawImage(rendered, area, new Rect(area.Size));
                        foreach (var view in Views(window)) {
                            if (pages.TryGetValue(view.PageId, out var png)) {
                                using (var stream = new MemoryStream(png))
                                using (var page = new Bitmap(stream)) {
                                    drawingContext.DrawImage(page, AreaOf(view, window).Translate(-(Vector)area.Position));
                                }
                            }
                        }
                        // the open popups (menus, flyouts) are native windows of their own, drawn where they sit over the window
                        foreach (var (popupRoot, offset) in Popups(window)) {
                            using (var popup = new RenderTargetBitmap(PixelSizeOf(popupRoot.Bounds.Size, scaling), dpi)) {
                                popup.Render(popupRoot);
                                drawingContext.DrawImage(popup, new Rect(new Point(offset.X, offset.Y) - (Vector)area.Position, popupRoot.Bounds.Size));
                            }
                        }
                    }
                    return Save(composed);
                }
            }
        }

        private static Dictionary<string, byte[]> PagesOf(HttpListenerRequest request) {
            var pages = new Dictionary<string, byte[]>();
            if (!request.HasEntityBody) {
                return pages;
            }
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding)) {
                var body = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string>>>(reader.ReadToEnd());
                if (body != null && body.TryGetValue("pages", out var encoded)) {
                    foreach (var entry in encoded) {
                        pages[entry.Key] = Convert.FromBase64String(entry.Value);
                    }
                }
            }
            return pages;
        }

        private static PixelSize PixelSizeOf(Size size, double scaling) =>
            new PixelSize(Math.Max(1, (int)Math.Ceiling(size.Width * scaling)), Math.Max(1, (int)Math.Ceiling(size.Height * scaling)));

        private static byte[] Save(RenderTargetBitmap bitmap) {
            using (var stream = new MemoryStream()) {
                bitmap.Save(stream);
                return stream.ToArray();
            }
        }

        private static void WriteJson(HttpListenerResponse response, object value) {
            response.ContentType = "application/json";
            Write(response, JsonSerializer.SerializeToUtf8Bytes(value, JsonOptions));
        }

        private static void WritePng(HttpListenerResponse response, byte[] png) {
            response.ContentType = "image/png";
            Write(response, png);
        }

        private static void WriteText(HttpListenerResponse response, string text) {
            response.ContentType = "text/plain";
            Write(response, Encoding.UTF8.GetBytes(text));
        }

        private static void Write(HttpListenerResponse response, byte[] bytes) {
            response.ContentLength64 = bytes.Length;
            response.OutputStream.Write(bytes, 0, bytes.Length);
        }
    }
}
