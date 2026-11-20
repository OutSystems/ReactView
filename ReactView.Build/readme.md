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
| `ReactViewBundle` | `true` | Set to `false` in a project that only needs the C# bindings of views that another project bundles. |
| `ReactViewGenerateBindings` | `true` | Set to `false` in a project that only bundles. |
| `ReactViewGeneratedPath`, `ReactViewOutputPath` | under `obj/` | Read-only: where the generated C# and the bundles are, for other targets of the project that consume them. |
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

- `GET /__reactview/status` returns `{ state: "building" | "ok" | "error", assemblies, builds, hash, builtAt, durationMs, errors, warnings, bindings }`, where `assemblies` are the ones it serves, `builds` the webpack builds it runs (`{ name, assembly, kind: "views" | "plugins" | "stylesheets" | "workers", hash, state }`) and `bindings` the state of the C# bindings generation
- `GET /__reactview/events` is a server-sent events stream with one `status` event per state change

An application whose views live in several assemblies (a plugins project, plugin modules of their own) is served by one dev server: list the other projects as `ReactViewDevServerProject` items of the project the target runs on, or pass them with `-p:ReactViewDevServerProjects="../Plugins/Plugins.csproj;../Other/Other.csproj"`. Each project is a webpack build of its own, served under `/<assembly>/` like its embedded resources are addressed, with its default stylesheets and workers; a views project gets react-refresh and its bindings regenerated. The application keeps the assemblies the server does not build embedded: the control asks the dev server, once per assembly, whether it has a manifest for it.

A change in a plugins project cannot be applied in place (its modules are globals every view captured when it loaded): the views reload from the current sources. Stylesheets, of any project, are refreshed in place.

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

This writes `reactview.mcp.json` next to the project, an `mcpServers` entry to merge into the project's `.mcp.json` (Claude Code) or any MCP client configuration. When the views live in a library, name the executable the server runs under `dotnet watch` with `-p:ReactViewApplicationProject=../MyApp/MyApp.csproj`. The application must open the DevTools protocol port in dev mode (`ReactViewFactory.RemoteDebuggingPort`, 9222 by default for the server).

An application that needs the developer before an agent can work on it (a login, a workspace to open) sets `ReactViewReadyExpression` in its project: a JavaScript expression evaluated in the application's pages, true in one of them once the application is ready, e.g. `!!window.__rv.query('.applications-list')`. `reactview_start` waits for it instead of handing the agent a login page, and `reactview_wait_for_ready` waits for it again after a restart under `dotnet watch`. Without it, the application is ready as soon as a view has rendered.

Tools: `reactview_start`, `reactview_stop`, `reactview_status`, `reactview_wait_for_build`, `reactview_wait_for_ready`, `reactview_logs`, `reactview_views`, `reactview_screenshot`, `reactview_dom`, `reactview_evaluate`, `reactview_click`, `reactview_type`, `reactview_console`, `reactview_reload`. Selectors search inner views (shadow roots) too.

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
