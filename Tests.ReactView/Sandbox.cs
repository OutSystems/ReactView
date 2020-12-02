using System;
using System.Threading.Tasks;
using Avalonia.Controls;
using Avalonia.Threading;

namespace Tests.ReactView {

    internal class Sandbox : IDisposable {

        private TestReactView View { get; }

        private Sandbox(Window window, string propertyValue) : this(propertyValue) {
            AttachTo(window);
        }

        public Sandbox(string propertyValue) {
            View = new TestReactView {
                PropertyValue = propertyValue
            };
        }

        public static async Task<Sandbox> InitializeAsync(Window window, string propertyValue) {
            var sandbox = await Dispatcher.UIThread.InvokeAsync(() => new Sandbox(window, propertyValue));
            await sandbox.Initialize();

            return sandbox;
        }

        public void AttachTo(Window window) {
            window.Content = View;
        }

        public Task<string> GetFirstRenderHtml() {
            return View.EvaluateMethod<string>("getFirstRenderHtml");
        }

        public Task<string> GetHtml() {
            return View.EvaluateMethod<string>("getHtml");
        }

        public Task<string> GetPropertyValue() {
            return View.EvaluateMethod<string>("getPropertyValue");
        }

        public string PropertyValue { 
            get => View.PropertyValue; 
            set => View.PropertyValue = value; 
        }

        public async Task Initialize() {
            await View.AwaitReady();
        }

        public void Dispose() {
            View.Dispose();
        }
    }
}