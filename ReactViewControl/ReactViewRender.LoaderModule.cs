using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WebViewControl;

namespace ReactViewControl {

    partial class ReactViewRender {

        internal class LoaderModule {

            private const string LoaderModuleName = "Loader";

            public LoaderModule(ReactViewRender viewRender) {
                ViewRender = viewRender;
            }

            private ReactViewRender ViewRender { get; }

            /// <summary>
            /// Loads the specified react component into the specified frame
            /// </summary>
            public void LoadComponent(IViewModule component, object componentNativeObject, string frameName, bool hasStyleSheet, bool hasPlugins, bool ensureDisposeInnerViews, bool loadScriptsOncePerDocument, bool ensureViewPluginsAreDisposed, bool bailOutOnUnboundNativeObjectCalls) {
                var mainSource = ViewRender.ToFullUrl(NormalizeUrl(component.MainJsSource));
                var dependencySources = component.DependencyJsSources.Select(s => ViewRender.ToFullUrl(NormalizeUrl(s))).ToArray();
                var cssSources = component.CssSources.Select(s => ViewRender.ToFullUrl(NormalizeUrl(s))).ToArray();

                var componentSerialization = SerializeComponent(component);
                var componentHash = ComputeHash(componentSerialization);

                // loadComponent arguments:
                //
                // componentName: string,
                // componentNativeObjectName: string,
                // componentSource: string,
                // dependencySources: string[],
                // cssSources: string[],
                // maxPreRenderedCacheEntries: number,
                // hasStyleSheet: boolean,
                // hasPlugins: boolean,
                // componentNativeObject: Dictionary<any>,
                // frameName: string
                // componentHash: string
                // ensureDisposeInnerViews: boolean
                // loadScriptsOncePerDocument: boolean
                // ensureViewPluginsAreDisposed: boolean
                // bailOutOnUnboundNativeObjectCalls: boolean
                // voidNativeObjectMethods: string[]

                var loadArgs = new[] {
                    JavascriptSerializer.Serialize(component.Name),
                    JavascriptSerializer.Serialize(component.GetNativeObjectFullName(frameName)),
                    JavascriptSerializer.Serialize(mainSource),
                    JavascriptSerializer.Serialize(dependencySources),
                    JavascriptSerializer.Serialize(cssSources),
                    JavascriptSerializer.Serialize(ReactView.PreloadedCacheEntriesSize),
                    JavascriptSerializer.Serialize(hasStyleSheet),
                    JavascriptSerializer.Serialize(hasPlugins),
                    componentSerialization,
                    JavascriptSerializer.Serialize(frameName),
                    JavascriptSerializer.Serialize(componentHash),
                    JavascriptSerializer.Serialize(ensureDisposeInnerViews),
                    JavascriptSerializer.Serialize(loadScriptsOncePerDocument),
                    JavascriptSerializer.Serialize(ensureViewPluginsAreDisposed),
                    JavascriptSerializer.Serialize(bailOutOnUnboundNativeObjectCalls),
                    JavascriptSerializer.Serialize(GetVoidNativeObjectMethods(component, componentNativeObject)),
                };

                ExecuteLoaderFunction("loadComponent", loadArgs);
            }

            /// <summary>
            /// Loads the specified stylesheet.
            /// </summary>
            /// <param name="stylesheet"></param>
            public void LoadDefaultStyleSheet(ResourceUrl stylesheet) {
                ExecuteLoaderFunction("loadDefaultStyleSheet", SerializeResourceUrl(stylesheet));
            }

            /// <summary>
            /// Loads the specified plugins modules in the specified frame.
            /// </summary>
            /// <param name="plugins"></param>
            /// <param name="frameName"></param>
            public void LoadPlugins(IViewModule[] plugins, string frameName) {
                var loadArgs = new[] {
                    JavascriptSerializer.Serialize(plugins.Select(m => new object[] {
                        m.Name, // plugin name
                        ViewRender.ToFullUrl(NormalizeUrl(m.MainJsSource)), // plugin source
                        m.GetNativeObjectFullName(frameName), // native object name
                        m.DependencyJsSources.Select(s => ViewRender.ToFullUrl(NormalizeUrl(s))) // plugin dependencies
                    })),
                    JavascriptSerializer.Serialize(frameName)
                };

                ExecuteLoaderFunction("loadPlugins", loadArgs);
            }

            /// <summary>
            /// Shows an resource load error message for the spcified url.
            /// </summary>
            /// <param name="url"></param>
            public void ShowResourceLoadFailedMessage(string url) {
                ShowErrorMessage($"Failed to load resource '{url}'. Open developer tools to see more details.");
            }

            /// <summary>
            /// Shows the specified error message.
            /// </summary>
            /// <param name="msg"></param>
            public void ShowErrorMessage(string msg) {
                msg = msg.Replace("\"", "\\\"");
                ExecuteLoaderFunction("showErrorMessage", JavascriptSerializer.Serialize(msg));
            }

            /// <summary>
            /// Prevents mouse interaction with the browser
            /// </summary>
            /// <param name="disable"></param>
            public void DisableMouseInteractions() {
                ExecuteLoaderFunction("disableMouseInteractions");
            }

            /// <summary>
            /// Enables mouse interaction with the browser
            /// </summary>
            /// <param name="disable"></param>
            public void EnableMouseInteractions() {
                ExecuteLoaderFunction("enableMouseInteractions");
            }

            /// <summary>
            /// Executes the specified javascript function on the Loader module.
            /// </summary>
            /// <param name="functionName"></param>
            /// <param name="args"></param>
            private void ExecuteLoaderFunction(string functionName, params string[] args) {
                // using setimeout we make sure the function is already defined
                var loaderUrl = new ResourceUrl(ResourcesAssembly, ReactViewResources.Resources.LoaderUrl);
                ViewRender.WebView.ExecuteScript($"import('{loaderUrl}').then(m => m.default.{LoaderModuleName}).then({LoaderModuleName} => {LoaderModuleName}.{functionName}({string.Join(",", args)}))");
            }

            private static string SerializeComponent(IViewModule component) {
                var nativeObjectMethodsMap = component.Events
                    .Select(g => new KeyValuePair<string, object>(g, JavascriptSerializer.Undefined))
                    .Concat(component.PropertiesValues)
                    .OrderBy(p => p.Key)
                    .Select(p => new KeyValuePair<string, object>(JavascriptSerializer.GetJavascriptName(p.Key), p.Value));
                return JavascriptSerializer.Serialize(nativeObjectMethodsMap, o => JavascriptSerializer.Serialize(o));
            }

            /// <summary>
            /// The names, as javascript sees them, of the native object methods that return nothing. Only
            /// calls to these can be dropped when the object is no longer bound: dropping a call that
            /// returns a value would hand the caller an undefined result instead of an error, and the
            /// failure would surface far away from its cause.
            /// A method that cannot be matched on the native object is left out, so an unexpected shape
            /// costs the bail out rather than the correctness of the call.
            /// </summary>
            private static string[] GetVoidNativeObjectMethods(IViewModule component, object componentNativeObject) {
                if (componentNativeObject == null) {
                    return new string[0];
                }

                var nativeMethods = componentNativeObject.GetType()
                    .GetMethods(BindingFlags.Public | BindingFlags.Instance)
                    .Where(m => m.DeclaringType != typeof(object))
                    .ToLookup(m => m.Name, StringComparer.OrdinalIgnoreCase);

                return component.Events
                    .Where(e => nativeMethods.Contains(e) && nativeMethods[e].All(m => ReturnsNothing(m.ReturnType)))
                    .Select(JavascriptSerializer.GetJavascriptName)
                    .ToArray();
            }

            /// <summary>
            /// A method returning Task, rather than Task&lt;T&gt;, is as void as one returning void: the
            /// promise the caller awaits carries no value either way.
            /// </summary>
            private static bool ReturnsNothing(Type returnType) {
                return returnType == typeof(void) || returnType == typeof(Task) || returnType == typeof(ValueTask);
            }

            private static string ComputeHash(string inputString) {
                using (var sha256 = SHA256.Create()) {
                    return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(inputString)));
                }
            }

            private string SerializeResourceUrl(ResourceUrl resource) {
                return JavascriptSerializer.Serialize(NormalizeUrl(ViewRender.ToFullUrl(resource.ToString())));
            }
        }
    }
}
