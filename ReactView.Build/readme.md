# ReactView.Build

MSBuild integration for [ReactView](https://github.com/OutSystems/ReactView). Referencing this package from a .NET project that hosts ReactView views makes `dotnet build`:

1. generate the C# bindings of the view components from their TypeScript declarations;
2. bundle the views, default stylesheets and workers with webpack and embed the results as resources.

It replaces the former `ViewGenerator`, `ViewGeneratorCore` and `ViewPacker` packages.

## Requirements

- Node.js 20 or later on the `PATH` (or set the `ReactViewNodeExe` MSBuild property).
- Access to the npm registry on the first build on a machine, to install the tooling dependencies.

The package itself ships no `node_modules`. The dependencies are described by the lockfile under `tools/` and are installed once per machine, into `%LocalAppData%/ReactView/tools/<tools id>` on Windows and `~/.local/share/ReactView/tools/<tools id>` elsewhere. The tools id changes with the package version and with the lockfile, so upgrading the package never reuses a stale install.

## Properties

| Property | Default | Purpose |
|---|---|---|
| `ReactViewToolsRoot` | per user local application data | Where the tooling dependencies are installed. Point it at a cached folder on CI agents. |
| `ReactViewNodeExe` | `node` | Node.js executable used for generation and bundling. |
| `ReactViewMinimumNodeMajor` | `20` | Lowest Node.js major version accepted. |
| `ReactViewSkipToolsInstall` | `false` | Skip the install step; the tools are expected to be present already. |
| `WP_OptimizeBundle` | `false` | Split the views bundle into shared chunks. |
| `PluginsRelativePath` | | Relative path to a plugins project whose bundle this project consumes. Its sources are inputs of this project's bundle. |

Items: `DefaultStyleSheet` (scss files bundled as the default stylesheets) and `Workers` (web worker entry points).

## Outputs

Nothing is written into the project folder. Everything the build produces goes under `obj/<platform>/<configuration>/<tfm>/reactview/`:

| Folder | Content |
|---|---|
| `cs/` | the generated C# bindings, compiled into the assembly |
| `out/` | the bundles, their `.entry` files and `manifest.json`, embedded as resources |
| `cache/` | the webpack filesystem cache used by Debug builds |

The embedded resources keep the names given by the `output` paths in `ts2lang.json`, for example `Generated/MainView.js` becomes the resource `<RootNamespace>.Generated.MainView.js`, exactly as when the files lived in the project folder. The paths in `ts2lang.json` are therefore resource paths, not folders on disk.

## Hot reload

Run the dev server for the project that owns the views:

```
dotnet msbuild MyApp.csproj -t:ReactViewDevServer
```

It bundles the views from the sources with webpack-dev-server and react-refresh, listens on `ReactViewDevServerUrl` (default `http://localhost:8080`), serves the project folder for assets, and publishes its build state:

- `GET /__reactview/status` returns `{ state: "building" | "ok" | "error", hash, builtAt, durationMs, errors, warnings, bindings }`, where `bindings` is the state of the C# bindings generation
- `GET /__reactview/events` is a server-sent events stream with one `status` event per state change

Point the application at it by returning the same url from `ReactViewFactory.DevServerUri`, typically from an environment variable in Debug builds. While it is set:

- views, stylesheets and assets are loaded from the dev server instead of the embedded resources;
- the development build of React is used, and react-refresh updates edited components in place (function components keep their state, class components remount);
- the pre-rendered views cache is disabled;
- an update that cannot be applied in place reloads the view: the component and its inner views are recreated from the current sources, the native objects and properties are kept. `ReactView.ReloadView()` does the same on demand (also `window.__reactview_hot__.reload()` and the MCP tool `reactview_reload`).

The dev server also regenerates the C# bindings after every build, into the same `obj/.../reactview/cs` folder the regular build uses, touching only the files whose content changed. Run the application under `dotnet watch` (same configuration and platform as the dev server) and a changed `IViewProperties`/`IViewBehaviors` interface reaches the C# side as a hot reload too:

```
dotnet msbuild MyApp.csproj -t:ReactViewDevServer -p:Platform=ARM64
DEV_SERVER_URI=http://localhost:8080 DOTNET_WATCH_RESTART_ON_RUDE_EDIT=true dotnet watch --project MyApp.csproj run --property:Platform=ARM64
```

## Agents (MCP server)

The package ships an MCP server that drives a development session: it starts the dev server and the application under `dotnet watch`, and exposes the running views. Write its configuration for a project with:

```
dotnet msbuild MyApp.csproj -t:ReactViewMcpConfig -p:Platform=ARM64
```

This writes `reactview.mcp.json` next to the project, an `mcpServers` entry to merge into the project's `.mcp.json` (Claude Code) or any MCP client configuration. The application must open the DevTools protocol port in dev mode (`ReactViewFactory.RemoteDebuggingPort`, 9222 by default for the server).

Tools: `reactview_start`, `reactview_stop`, `reactview_status`, `reactview_wait_for_build`, `reactview_logs`, `reactview_views`, `reactview_screenshot`, `reactview_dom`, `reactview_evaluate`, `reactview_click`, `reactview_type`, `reactview_console`, `reactview_reload`. Selectors search inner views (shadow roots) too.

## Project setup

1. Reference the package with `PrivateAssets="all"`.
2. Build once. `tsconfig.json`, `ts2lang.json` and `global.d.ts` are copied into the project when missing. Adjust `ts2lang.json`:

```json
{
    "tasks": [
        {
            "input": "**/*.view.tsx",
            "output": "Generated/",
            "parameters": {
                "namespace": "YourNamespace",
                "baseComponentClass": "",
                "javascriptDistPath": ""
            }
        }
    ]
}
```

3. Write the components. The conventions the generator relies on:
   - properties and behaviors interfaces are named `I<Name>Properties` and `I<Name>Behaviors`;
   - the component is the default export;
   - every type used by those interfaces is exported from the same file;
   - behavior methods return `void`.

```tsx
import * as React from "react";
import "./Styles.scss";

export interface ISomeType {
    name: string;
}

export interface IExampleProperties {
    click(arg: ISomeType): void;
    getData(): Promise<string>;
}

export interface IExampleBehaviors {
    refresh(): void;
}

export default class Example extends React.Component<IExampleProperties, {}> implements IExampleBehaviors {

    refresh(): void {
        alert("hey");
    }

    render() {
        return <button onClick={() => this.props.click(null)}>Click me!</button>;
    }
}
```

4. Build and run.
