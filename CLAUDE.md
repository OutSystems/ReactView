# ReactView

React (TypeScript) views hosted in .NET desktop applications (Avalonia, WPF) through CEF. The `.view.tsx` is the source of truth: `ReactView.Build` generates the C# bindings from its exported interfaces and bundles the views into the assembly.

## Layout

- `ReactViewControl/`, `ReactViewControl.Avalonia/`: the host control. `ReactViewControl.Avalonia.csproj` lists the shared sources explicitly; add new files there too.
- `ReactViewResources/`: the loader that runs in the webview (`Loader/`), compiled by the TypeScript MSBuild integration into `Loader.js`.
- `ReactView.Build/`: the MSBuild package (NoTargets project). `build/` targets, `tools/webpack/` bundling, `tools/generator/` the C# template, `tools/mcp/` the MCP server. `tools/package.json` pins the Node dependencies; they are installed per machine on first build, never shipped.
- `Sample.Avalonia/`: the reference application. `Tests.ReactView/`: NUnit UI tests, Windows only.

## Commands

Node 22 (`.node-version`) and the .NET SDK. On Apple Silicon use `-p:Platform=ARM64`; there is no x64 runtime.

```
dotnet build ReactView.Build/ReactView.Build.csproj -c Release        # repack the build package (delete packages/reactview.build first)
dotnet build Sample.Avalonia/Sample.Avalonia.csproj -c Debug -p:Platform=ARM64
dotnet msbuild Sample.Avalonia/Sample.Avalonia.csproj -t:ReactViewDevServer -p:Platform=ARM64   # hot reload server (+ the project's ReactViewDevServerProject items)
DEV_SERVER_URI=http://localhost:8080 DOTNET_WATCH_RESTART_ON_RUDE_EDIT=true dotnet watch --project Sample.Avalonia run -c Debug --property:Platform=ARM64
dotnet msbuild Sample.Avalonia/Sample.Avalonia.csproj -t:ReactViewMcpConfig -p:Platform=ARM64   # MCP server config for agents
```

After changing anything under `ReactView.Build/`, repack and rebuild the sample: consumers use the package from `nuget/`, restored into `packages/`. Repacking keeps the version, so also delete the consumer's `packages/reactview.build` and run `dotnet build-server shutdown`: MSBuild worker nodes cache the parsed targets of the previous package.

## View conventions (enforced by the generator)

- Properties interface `I<Name>Properties`, behaviors interface `I<Name>Behaviors`, optional `IChildViews`; the component is the default export.
- Every type used by those interfaces is exported from the same file; behavior methods return `void`.
- Generated C# goes to `obj/<platform>/<config>/<tfm>/reactview/cs`, bundles to `.../out`; nothing is written into the source tree.
- Hot reload: function components refresh in place, class components and modules exporting enums remount, a plugins project change reloads the views. New interface members restart the application under `dotnet watch`. `ReactView.ReloadView()` (MCP: `reactview_reload`) recreates the views from the current sources when an update could not be applied, e.g. plugin modules.

## Verifying changes

Build the sample, then run it in dev mode and use the MCP server (or `tools/mcp` over the DevTools port 9222) to read the DOM, screenshot and console. The NUnit suite only runs on Windows.
