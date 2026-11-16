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
| `ViewGeneratorGeneratedFolder` | `Generated` | Folder, relative to the project, that receives the generated C# files. |
| `WP_OptimizeBundle` | `false` | Split the views bundle into shared chunks. |
| `PluginsRelativePath` | | Relative path to a plugins project whose bundle this project consumes. |

Items: `DefaultStyleSheet` (scss files bundled as the default stylesheets) and `Workers` (web worker entry points).

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
