#! /bin/bash
VIEW_GENERATOR_PATH=/Users/mpm/Development/git/O11IDE/packages/viewgenerator/1.1.17
VIEW_PACKER_PATH=/Users/mpm/Development/git/O11IDE/packages/viewpacker/1.1.5
PLUGINS_FOLDER=$~dp0../Plugins
PLUGIN_APPLICATION_CREATION_WIZARD=$PLUGINS_FOLDER/ApplicationCreationWizard/ServiceStudio
PLUGIN_CHROME_DEBUGGER_ADAPTER=$PLUGINS_FOLDER/ChromeDebuggerAdapter/ServiceStudio
FRAMEWORK_OUSYSTEMS_NODE_MODULES=/Users/mpm/Development/git/O11IDE/ServiceStudio/ServiceStudio.WebViewImplementation/../ServiceStudio.WebViewImplementation.Framework/node_modules/@outsystems
FRAMEWORK_OUSYSTEMS_DESIGN_SYSTEM=/Users/mpm/Development/git/O11IDE/ServiceStudio/ServiceStudio.WebViewImplementation/../ServiceStudio.WebViewImplementation.Framework/node_modules/@os-designsystem

node "$VIEW_PACKER_PATH/tools/node_modules/webpack-dev-server/bin/webpack-dev-server.js" --config="$VIEW_GENERATOR_PATH/tools/webpack/webpack_views.config.js" --mode=development --devtool=inline-source-map --env forHotReload=true --env useCache=true --env pluginsRelativePath='..' --env assemblyName="Sample.Avalonia"

node "/Users/mpm/Development/git/ReactView/packages/viewpacker/1.1.5/tools/node_modules/webpack-dev-server/bin/webpack-dev-server.js" --config="/Users/mpm/Development/git/ReactView/packages/viewgenerator/1.1.17/tools/webpack/webpack_views.config.js" --env forHotReload=true --mode=development --devtool=inline-source-map --env useCache=true --env pluginsRelativePath='' --env assemblyName='Sample.Avalonia'