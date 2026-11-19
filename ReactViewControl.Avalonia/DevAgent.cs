using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Avalonia.VisualTree;

namespace ReactViewControl {

    /// <summary>
    /// Dev mode only (the application loads its views from the dev server): a local http endpoint for the tools that
    /// drive the application (the ReactView MCP server), covering what the DevTools protocol of the views does not see,
    /// the native windows around them: the windows, their visual tree, screenshots of a window or of one of its
    /// controls, raising a window. Listens on 127.0.0.1:REACTVIEW_AGENT_PORT (default 9223); 0 disables it.
    /// </summary>
    internal static class DevAgent {

        private const int DefaultPort = 9223;

        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions() {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
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
                    case "/screenshot":
                        var pages = PagesOf(context.Request);
                        WritePng(response, await OnUIThread(() => Screenshot(query, pages)));
                        break;
                    default:
                        response.StatusCode = (int)HttpStatusCode.NotFound;
                        WriteText(response, "unknown path: /windows, /activate?window=, /tree?window=&name=&type=&depth=, /screenshot?window=&name=&type=&scale= (POST { pages: { id: png base64 } })");
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

        /// <summary>The control the request names (name=, or type=), the window itself when it names none.</summary>
        private static Visual ControlOf(Window window, NameValueCollection query) {
            var name = query["name"];
            var type = query["type"];
            if (string.IsNullOrEmpty(name) && string.IsNullOrEmpty(type)) {
                return window;
            }
            var control = window.GetVisualDescendants()
                .Where(v => v.IsEffectivelyVisible)
                .FirstOrDefault(v => (string.IsNullOrEmpty(name) || (v as Control)?.Name == name) && (string.IsNullOrEmpty(type) || v.GetType().Name == type));
            return control ?? throw new InvalidOperationException($"no visible control with name '{name}' / type '{type}' in window '{window.Title}'");
        }

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

        private static Rect AreaOf(Visual visual, Window window) => new Rect(visual.TranslatePoint(new Point(), window) ?? new Point(), visual.Bounds.Size);

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

        private static object Tree(NameValueCollection query) {
            var window = WindowOf(query);
            var root = ControlOf(window, query);
            var maxDepth = int.TryParse(query["depth"], out var depth) ? depth : 100;
            return Node(root, window, maxDepth);
        }

        private static object Node(Visual visual, Window window, int depth) {
            var origin = visual.TranslatePoint(new Point(), window) ?? new Point();
            return new {
                type = visual.GetType().Name,
                name = string.IsNullOrEmpty((visual as Control)?.Name) ? null : ((Control)visual).Name,
                classes = (visual as StyledElement)?.Classes.Count > 0 ? string.Join(" ", ((StyledElement)visual).Classes) : null,
                text = TextOf(visual),
                page = (visual as ReactViewRender)?.PageId,
                x = Math.Round(origin.X, 1),
                y = Math.Round(origin.Y, 1),
                width = Math.Round(visual.Bounds.Width, 1),
                height = Math.Round(visual.Bounds.Height, 1),
                visible = visual.IsEffectivelyVisible ? (bool?)null : false,
                // the subtree of a hidden control is noise, so is the one below the requested depth
                children = depth > 0 && visual.IsEffectivelyVisible ? visual.GetVisualChildren().Select(c => Node(c, window, depth - 1)).ToArray() : null
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
