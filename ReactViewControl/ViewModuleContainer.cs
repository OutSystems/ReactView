using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using WebViewControl;

namespace ReactViewControl {

    public abstract class ViewModuleContainer : IViewModule {

        private IFrame frame;
        private IChildViewHost childViewHost;
        private readonly IModuleDependenciesProvider dependenciesProvider;

        public ViewModuleContainer() {
            DependencyJsSourcesCache = new Lazy<string[]>(() => GetJsDependencies());
            CssSourcesCache = new Lazy<string[]>(() => GetCssDependencies());
            
            dependenciesProvider = ModuleDependenciesProviderFactory.CreateDependenciesProviderInstance(MainJsSource);
            
            frame = new FrameInfo("dummy");
        }

        public static IModuleDependenciesProviderFactory ModuleDependenciesProviderFactory { set; get; } = new ModuleDependenciesProviderFactory();

        private Lazy<string[]> DependencyJsSourcesCache { get; }
        private Lazy<string[]> CssSourcesCache { get; }

        protected virtual string MainJsSource => null;
        protected virtual string NativeObjectName => null;
        protected virtual string ModuleName => null;
        protected virtual string Source => null;

        protected virtual object CreateNativeObject() => null;

        protected virtual string[] Events => new string[0];

        protected virtual string[] DependencyJsSources => new string[0];

        protected virtual string[] CssSources => new string[0];

        protected virtual KeyValuePair<string, object>[] PropertiesValues => new KeyValuePair<string, object>[0];

        string IViewModule.MainJsSource => MainJsSource;

        string IViewModule.NativeObjectName => NativeObjectName;

        string IViewModule.Name => ModuleName;

        string IViewModule.Source => Source;

        object IViewModule.CreateNativeObject() => CreateNativeObject();

        string[] IViewModule.Events => Events;

        string[] IViewModule.DependencyJsSources => dependenciesProvider.GetJsDependencies(MainJsSource);

        string[] IViewModule.CssSources => dependenciesProvider.GetCssDependencies(MainJsSource);

        KeyValuePair<string, object>[] IViewModule.PropertiesValues => PropertiesValues;

        void IViewModule.Bind(IFrame frame, IChildViewHost childViewHost) {
            frame.CustomResourceRequestedHandler += this.frame.CustomResourceRequestedHandler;
            frame.ExecutionEngine.MergeWorkload(this.frame.ExecutionEngine);
            this.frame = frame;
            this.childViewHost = childViewHost;
        }

        // ease access in generated code
        protected IExecutionEngine ExecutionEngine {
            get {
                var engine = frame.ExecutionEngine;
                if (engine == null) {
                    throw new InvalidOperationException("View module must be bound to an execution engine");
                }
                return engine;
            }
        }

        private string[] GetJsDependencies() => dependenciesProvider.GetJsDependencies(MainJsSource);

        private string[] GetCssDependencies() => dependenciesProvider.GetCssDependencies(MainJsSource);

        public event CustomResourceRequestedEventHandler CustomResourceRequested {
            add => frame.CustomResourceRequestedHandler += value;
            remove => frame.CustomResourceRequestedHandler -= value;
        }

        public T WithPlugin<T>() {
            return frame.GetPlugin<T>();
        }

        public void Load() {
            childViewHost?.LoadComponent(frame.Name, this);
        }

        public T GetOrAddChildView<T>(string frameName) where T : IViewModule, new() {
            if (childViewHost == null) {
                return default(T);
            }
            return childViewHost.GetOrAddChildView<T>(frame.Name + (string.IsNullOrEmpty(frame.Name) ? "" : ".") + frameName);
        }

        public ReactView Host => childViewHost?.Host;

        public virtual Uri DevServerUri { get; set; }
    }
}
