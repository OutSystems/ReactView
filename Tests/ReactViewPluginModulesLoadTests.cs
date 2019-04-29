﻿using NUnit.Framework;
using ReactViewControl;

namespace Tests {

    public class ReactViewPluginModulesLoadTests : ReactViewTestBase {

        class PluginModule : ViewModuleContainer {

            internal interface IProperties {
            }

            private class Properties : IProperties {
                protected readonly PluginModule owner;
                public Properties(PluginModule owner) {
                    this.owner = owner;
                }
            }

            protected override string JavascriptSource => "/Tests/ReactViewResources/Test/PluginModule.js";
            protected override string NativeObjectName => "Common";
            protected override string ModuleName => "Plugin/With/Slashes/On/Name";
            protected override object CreateNativeObject() {
                return new Properties(this);
            }
        }

        protected override void InitializeView() {
            TargetView.Plugins = new[] { new PluginModule() };
            base.InitializeView();
        }

        [Test(Description = "Tests plugin module is loaded")]
        public void PluginModuleIsLoaded() {
            var pluginModuleLoaded = false;
            TargetView.Event += (args) => {
                pluginModuleLoaded = args == "PluginModuleLoaded";
            };

            TargetView.ExecuteMethodOnRoot("checkPluginModuleLoaded");

            WaitFor(() => pluginModuleLoaded, "plugin module load");
        }
    }
}
