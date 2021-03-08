﻿using System;
using System.Threading.Tasks;
using ReactViewControl;

namespace Tests.ReactView {

    public class InnerViewModule : ViewModuleContainer {

        public class Properties {

            private InnerViewModule Owner { get; }

            public Properties(InnerViewModule owner) {
                Owner = owner;
            }

            public void Loaded() {
                Owner.Loaded?.Invoke();
            }

            public void MethodCalled(bool contextLoaded) {
                Owner.MethodCalled?.Invoke(contextLoaded);
            }
        }

        public event Action Loaded;

        public event Action<bool> MethodCalled;

        public void TestMethod() {
            ExecutionEngine.ExecuteMethod(this, "testMethod");
        }

        protected override string MainJsSource => "/Tests.ReactView/Generated/InnerView.js";

        protected override string NativeObjectName => nameof(InnerViewModule);

        protected override string ModuleName => "InnerView";

        protected override object CreateNativeObject() {
            return new Properties(this);
        }

        protected override string[] Events => new[] { "loaded", "methodCalled" };

    }
}
