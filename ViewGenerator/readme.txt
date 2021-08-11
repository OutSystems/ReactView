******************
* View Generator *
******************

This tool generates the .NET bindings for the React Web views based on the TypeScript declarations on the UI components.

How to use:
-----------

1) Change the ts2lang.json configuration file on the root of your project to match your needs:

	{
		"tasks": [
			{
				"input": Path where the declaration of the UI (typescript) files live,
				"output": Path where the generated C# class files will be written,
				"template": Leave empty,
				"parameters": {
					"namespace": Namespace to be used in the generated C# classes,
					"baseComponentClass": Name of the base class of the UI component. Use this if you need to inherit from a base component other than the default,
					"javascriptDistPath": Place where the typescript compiler will place the compiled js files
				}
			}
		]
	}

2) Create the TypeScript definition of your component.
   Some conventions must be followed to comply with the View Generator requirements:
   - The properties and behaviors interfaces must follow the following naming conventions start with I and end with Properties or Behaviors suffix.
   - Don't forget to export default your component.
   - Any types present in the IProperties or IBehaviors interfaces must be defined on the same file where the interfaces are declared.
   - Behavior methods cannot return any values i.e. their return type must be void.
   - All types must be exported in order for its C# binding be generated.

	Eg:

	import * as React from "react";
	import "third-party-lib"; /// import third-party lib modules
	import "./LocalModule"; /// import local js modules
	import "./Styles.scss"; /// import local sass

	export interface ISomeType {
		name: string;
	}

	/// This interface will contain all the component events that can be subscribed on the C# code.
	/// Use the Properties interface expose an API to get data from C#.
	export interface IExampleProperties {
		click(arg: ISomeType): void;
		getData(): Promise<string>;
	}

	/// This interface will contain all the component methods that can be called on the C# code.
	export interface IExampleBehaviors {
		refresh(): void;
	}

	export default class Example extends React.Component<IExampleProperties, {}> implements IExampleBehaviors {

	    refresh(): void {
			alert("hey");
		}

		render() {
			return <button onClick={() => this.props.click(null)}>Click me!</button>
		}
	}


3) Build the project and run.

