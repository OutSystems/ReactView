using System;
using System.Collections.Generic;

namespace ReactViewControl {

    public abstract class ViewModuleContainer : IViewModule {

        private const string JsEntryFileExtension = ".js.entry";
        private const string CssEntryFileExtension = ".css.entry";

        private IFrame frame;
        private IChildViewHost childViewHost;
        private IModuleDependenciesProvider dependenciesProvider;

        public ViewModuleContainer() {
            frame = new FrameInfo("dummy");
        }

        public virtual IModuleDependenciesProvider DependenciesProvider {
            get { return dependenciesProvider ??= new FileDependenciesProvider(MainJsSource); }
            set { dependenciesProvider = value; }
        }

        protected virtual string MainJsSource => null;
        protected virtual string NativeObjectName => null;
        protected virtual string ModuleName => null;
        protected virtual string Source => null;

        protected virtual object CreateNativeObject() => null;

        protected virtual string[] Events => new string[0];

        protected virtual KeyValuePair<string, object>[] PropertiesValues => new KeyValuePair<string, object>[0];

        string IViewModule.MainJsSource => MainJsSource;

        string IViewModule.NativeObjectName => NativeObjectName;

        string IViewModule.Name => ModuleName;

        string IViewModule.Source => Source;

        object IViewModule.CreateNativeObject() => CreateNativeObject();

        string[] IViewModule.Events => Events;

        string[] IViewModule.DependencyJsSources => DependenciesProvider.GetJsDependencies(MainJsSource);

        string[] IViewModule.CssSources => DependenciesProvider.GetCssDependencies(MainJsSource);

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
            return childViewHost.GetOrAddChildView<T>(FormatChildViewName(frameName));
        }

        public bool AddChildView(IViewModule childView, string frameName) {
            if (childViewHost == null) {
                return false;
            }
            return childViewHost.AddChildView(childView, FormatChildViewName(frameName));
        }

        public ReactView Host => childViewHost?.Host;

        private string FormatChildViewName(string name) => frame.Name + (string.IsNullOrEmpty(frame.Name) ? "" : ".") + name;
    }
}
