using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;

namespace WebViewControl {

    public class GlobalSettings {

        private Color backgroundColor = Color.White;
        private bool persistCache;
        private bool enableErrorLogOnly;
        private bool enableVideoAutoplay;
        private bool osrEnabled;
        private string userAgent;
        private string logFile;
        private string cachePath = Path.Combine(Path.GetTempPath(), "WebView" + Guid.NewGuid().ToString().Replace("-", null) + DateTime.UtcNow.Ticks);
        private readonly List<KeyValuePair<string, string>> commandLineSwitches = new List<KeyValuePair<string, string>>();

        /// <summary>
        /// Kept for API compatibility. The native web views (WKWebView, WebView2) are not configured through chromium command line switches.
        /// </summary>
        public void AddCommandLineSwitch(string key, string value) {
            EnsureNotLoaded(nameof(AddCommandLineSwitch));
            commandLineSwitches.Add(new KeyValuePair<string, string>(key, value));
        }

        public IEnumerable<KeyValuePair<string, string>> CommandLineSwitches => commandLineSwitches;

        /// <summary>
        /// Gets or sets the background color of the WebView control.
        /// Default is <see cref="Color.White"/>.
        /// Note: Transparent colors (alpha &lt; 255) are not supported.
        /// </summary>
        public Color BackgroundColor {
            get => backgroundColor;
            set {
                EnsureNotLoaded(nameof(BackgroundColor));
                backgroundColor = value;
            }
        }

        /// <summary>
        /// Only used when <see cref="PersistCache"/> is set (otherwise the web view uses a non persistent data store).
        /// </summary>
        public string CachePath {
            get => cachePath;
            set {
                EnsureNotLoaded(nameof(CachePath));
                cachePath = value;
            }
        }

        public bool PersistCache {
            get => persistCache;
            set {
                EnsureNotLoaded(nameof(PersistCache));
                persistCache = value;
            }
        }

        public bool EnableErrorLogOnly {
            get => enableErrorLogOnly;
            set {
                EnsureNotLoaded(nameof(EnableErrorLogOnly));
                enableErrorLogOnly = value;
            }
        }

        public string UserAgent {
            get => userAgent;
            set {
                EnsureNotLoaded(nameof(UserAgent));
                userAgent = value;
            }
        }

        public string LogFile {
            get => logFile;
            set {
                EnsureNotLoaded(nameof(LogFile));
                logFile = value;
            }
        }

        /// <summary>
        /// Kept for API compatibility. Native web views always render using the platform's compositor, off-screen rendering is not supported.
        /// </summary>
        public bool OsrEnabled {
            get => osrEnabled;
            set {
                EnsureNotLoaded(nameof(OsrEnabled));
                osrEnabled = value;
            }
        }

        /// <summary>
        /// Set to true to enable video autoplay without requiring user interaction.
        /// This allows muted videos with the autoplay attribute to play automatically.
        /// Default is false for security and user experience considerations.
        /// </summary>
        public bool EnableVideoAutoplay {
            get => enableVideoAutoplay;
            set {
                EnsureNotLoaded(nameof(EnableVideoAutoplay));
                enableVideoAutoplay = value;
            }
        }

        /// <summary>
        /// True when the first web view has been created. From that point on the global settings are frozen.
        /// </summary>
        internal bool IsLoaded { get; set; }

        private void EnsureNotLoaded(string propertyName) {
            if (IsLoaded) {
                throw new InvalidOperationException($"Cannot set {propertyName} after WebView engine has been loaded");
            }
        }
    }
}
