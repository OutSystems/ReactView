﻿import * as Types from "@outsystems/ts2lang/ts-types";
import * as Units from "@outsystems/ts2lang/ts-units";

const GeneratedFilesHeader = "/*** Auto-generated ***/";

const DelegateSuffix = "EventHandler";
const BaseComponentAliasName = "BaseComponent";
const BaseModuleAliasName = "BaseModule";
const PropertiesClassName = "Properties";
const PropertiesInterfaceSuffix = "Properties";
const BehaviorsInterfaceSuffix = "Behaviors";
const ExecutionEnginePropertyName = "ExecutionEngine";
const TrackIdPropertyName = "trackId";
const TrackIdPropertyType = "TrackId";
const TrackableInterfaceName = "ITrackable";

function f(input: string) {
    if (!input) {
        return "";
    }
    return input.replace(/\n/g, "\n    ");
}

function toPascalCase(name: string) {
    return name[0].toUpperCase() + name.substr(1);
}

function normalizePath(path: string): string {
    return path.replace(/\\/g, "/")
}

function isTrackIdType(type: Types.ITsType) {
    return type.name === TrackIdPropertyType;
}

function isTrackIdProperty(prop: Units.TsProperty) {
    return prop.name === TrackIdPropertyName && isTrackIdType(prop.type);
}

class Generator {

    private propsInterface: Units.TsInterface | null;
    private behaviorsInterface: Units.TsInterface | null;
    private component: Units.TsClass;
    private objects: Units.TsInterface[];
    private enums: Units.TsEnum[];
    private propsInterfaceCoreName: string;
    private componentName: string;
    private trackableObjectsNames: { [key: string]: boolean };

    constructor(
        module: Units.TsModule,
        private namespace: string,
        private relativePath: string,
        private fullPath: string,
        private filename: string,
        private preamble: string,
        private baseComponentClass: string,
        private baseModuleClass: string,
        private baseComponentInterface: string,
        private isModule: boolean) {

        this.component = module.classes.filter(c => c.isPublic)[0];
        let interfaces = module.interfaces.filter((ifc) => ifc.isPublic && ifc.name.startsWith("I"));
        this.propsInterface = interfaces.find((ifc) => ifc.name.endsWith(PropertiesInterfaceSuffix)) || null;
        this.behaviorsInterface = interfaces.find((ifc) => ifc.name.endsWith(BehaviorsInterfaceSuffix)) || null;
        this.objects = module.interfaces.filter(ifc => ifc.isPublic && ifc !== this.propsInterface && ifc !== this.behaviorsInterface);
        this.enums = module.enums.filter(e => e.isPublic);

        this.propsInterfaceCoreName = this.propsInterface ? this.propsInterface.name.substring(1, this.propsInterface.name.length - PropertiesInterfaceSuffix.length) : "";
        this.componentName = this.component ? this.component.name : this.propsInterfaceCoreName;

        // build a dictionary of objects names that have a track id property (and include the object[] version too)
        this.trackableObjectsNames = this.objects.filter(o => o.properties.some(isTrackIdProperty)).map(o => o.name).reduce((o, name) => { o[name] = true; o[name + "[]"] = true; return o; }, {});
    }

    private get moduleName() {
        return this.componentName + (this.isModule ? "" : "Module"); // if not a module we need to add Module suffix
    }

    private getFunctionReturnType(func: Units.TsFunction): string {
        let returnType = <Types.TsIdentifierType>func.returnType;
        if (returnType.parameters && returnType.parameters.length > 0) {
            return this.getTypeName(returnType.parameters[0]);
        }
        return this.getTypeName(returnType);
    }

    private getTypeName(tsType: Types.ITsType): string {
        switch (tsType.name) {
            case "string":
                return "string";
            case "number":
                return "double";
            case "boolean":
                return "bool";
            case "void":
                return "void";
            default:
                if (isTrackIdType(tsType)) {
                    return "string";
                }

                if (tsType instanceof Types.TsArrayType) {
                    return this.getTypeName(tsType.getInner()) + "[]";
                }

                if (tsType.isBasic) {
                    return tsType.name;
                }

                return this.getTypeNameAlias(tsType.name);
        }
    }

    private getTypeNameAlias(name: string): string {
        if (name.startsWith("I") && name.charAt(1) === name.charAt(1).toUpperCase()) {
            return name.substr(1);
        }
        return name;
    }

    private generateMethodSignature(func: Units.TsFunction, functionPrefix: string = "", functionSuffix: string = "") {
        return `${this.getFunctionReturnType(func)} ${functionPrefix}${toPascalCase(func.name)}${functionSuffix}(${func.parameters.map(p => this.getTypeName(p.type) + " " + p.name).join(", ")})`;
    }

    private generateNativeApi() {
        const ownerPropertyName = "Owner";
        const generateNativeApiMethod = (func: Units.TsFunction) => {
            const trackObject = (body: string) => {
                if (this.trackableObjectsNames[this.getFunctionReturnType(func)]) {
                    return `${ownerPropertyName}.${ExecutionEnginePropertyName}.TrackObject(${body})`;
                }
                return body;
            };

            const getTrackedObject = (param: Units.TsParameter) => {
                if (this.trackableObjectsNames[param.type.name]) {
                    return `${ownerPropertyName}.${ExecutionEnginePropertyName}.GetTrackedObject(${param.name})`;
                }
                return param.name;
            };

            let isVoid = func.returnType.name === Types.TsVoidType.name;
            let body = `${ownerPropertyName}.${toPascalCase(func.name)}?.Invoke(${func.parameters.map(p => getTrackedObject(p)).join(", ")})${isVoid ? "" : " ?? default"}`;
            return (
                `public ${this.generateMethodSignature(func)} => ${trackObject(body)};\n`
            );
        }

        return (
            `internal interface I${PropertiesClassName} {\n` +
            `    ${f(this.propsInterface ? this.propsInterface.functions.map(f => this.generateMethodSignature(f) + ";").join("\n") : "")}\n` +
            `}\n` +
            `\n` +
            `private class ${PropertiesClassName} : I${PropertiesClassName} {\n` +
            `    protected ${this.moduleName} ${ownerPropertyName} { get; }\n` +
            `    public ${PropertiesClassName}(${this.moduleName} owner) => ${ownerPropertyName} = owner;\n` +
            `    ${f(this.propsInterface ? (this.propsInterface.functions.length > 0 ? this.propsInterface.functions.map(f => generateNativeApiMethod(f)).join("\n") : "// the interface does not contain methods") : "")}\n` +
            `}`
        );
    }

    private generateNativeApiObjects() {
        return this.objects.map(o => this.generateNativeApiObject(o))
            .concat(this.enums.map(e => this.generateNativeApiEnum(e)))
            .join("\n\n");
    }

    private generateNativeApiObject(objInterface: Units.TsInterface) {
        let objectName = this.getTypeNameAlias(objInterface.name);
        let isTrackable = this.trackableObjectsNames[objInterface.name];
        let generateMerge = () => {
            return f(
                `\n` +
                `private string __${TrackIdPropertyName};\n` +
                `public string ${TrackIdPropertyName} {\n` +
                `    get => __${TrackIdPropertyName} = __${TrackIdPropertyName} ?? System.Guid.NewGuid().ToString();\n` +
                `    set => __${TrackIdPropertyName} = value;\n` +
                `}\n` +
                `\n` +
                `void ${TrackableInterfaceName}.Merge(object other) {\n` +
                `    var otherObj = (${objectName}) other;\n` +
                `    this.__${TrackIdPropertyName} = ((${TrackableInterfaceName}) other).${TrackIdPropertyName};\n` +
                `    ${f(objInterface.properties.filter(p => !isTrackIdProperty(p)).map(p => `this.${p.name} = otherObj.${p.name};`).join("\n"))}\n` +
                `}`
            ) + "\n";
        };
        return (
            `#pragma warning disable CS0282\n` +
            `public partial struct ${objectName} ${isTrackable ? `: ${TrackableInterfaceName} ` : ""}{\n` +
            `#pragma warning restore CS0282\n` +
            `    ${f(objInterface.properties.filter(p => !isTrackIdProperty(p)).map(p => `public ${this.getTypeName(p.type)} ${p.name} { get; set; }`).join("\n"))}\n` +
            (isTrackable ? generateMerge() : "") +
            `}`
        );
    }

    private generateNativeApiEnum(enumerate: Units.TsEnum) {
        return (
            `public enum ${enumerate.name} {\n` +
            `    ${f(enumerate.options.map(o => `${o.name}`).join(",\n"))}\n` +
            `}`
        );
    }

    private generatePropertyEvent(func: Units.TsFunction, accessibility: string = "public"): string {
        accessibility = accessibility ? accessibility + " " : "";
        return `${accessibility}event ${this.componentName}${toPascalCase(func.name)}${DelegateSuffix} ${toPascalCase(func.name)}`
    }

    private generateProperty(prop: Units.TsProperty, accessibility: string = "public"): string {
        accessibility = accessibility ? accessibility + " " : "";
        return `${accessibility}${this.getTypeName(prop.type)} ${toPascalCase(prop.name)} { get; set; }`
    }

    private generateComponentBody(generatePropertyEvent: (prop: Units.TsFunction) => string, generateProperty: (prop: Units.TsProperty) => string, generateBehaviorMethod: (func: Units.TsFunction) => string) {
        return (
            this.propsInterface ? this.propsInterface.functions.map(generatePropertyEvent).concat(this.propsInterface.properties.map(generateProperty)) : [])
            .concat(this.behaviorsInterface ? this.behaviorsInterface.functions.map(generateBehaviorMethod) : [])
            .join("\n");
    }

    private generateComponentWrapperBody(hostPropertyName: string) {
        const generatePropertyEvent = (func: Units.TsFunction) => {
            let eventName = toPascalCase(func.name);
            return (
                `public event ${this.componentName}${eventName}${DelegateSuffix} ${eventName} {\n` +
                `    add => ${hostPropertyName}.${eventName} += value;\n` +
                `    remove => ${hostPropertyName}.${eventName} -= value;\n` +
                `}`
            );
        };
        const generateProperty = (prop: Units.TsProperty) => {
            let propertyName = toPascalCase(prop.name);
            return (
                `public ${this.getTypeName(prop.type)} ${propertyName} {\n` +
                `    get => ${hostPropertyName}.${propertyName};\n` +
                `    set => ${hostPropertyName}.${propertyName} = value;\n` +
                `}`
            );
        };
        const generateBehaviorMethod = (func: Units.TsFunction) => {
            return (
                `public ${this.generateMethodSignature(func)} => ${hostPropertyName}.${toPascalCase(func.name)}(${func.parameters.map(p => p.name).join(",")});\n`
            );
        };
        return this.generateComponentBody(generatePropertyEvent, generateProperty, generateBehaviorMethod);
    }

    private generateComponentAdapter() {
        return (
            `partial class ${this.componentName}Adapter : I${this.componentName} {\n` +
            `\n` +
            `    ${f(this.generateComponentWrapperBody("Component"))}\n` +
            `}\n`
        );
    }

    private generateComponentClass() {
        const mainModulePropertyName = "MainModule";
        const keyValuePairType = "System.Collections.Generic.KeyValuePair<string, object>";

        const generatePropertyEvent = (func: Units.TsFunction) => `${this.generatePropertyEvent(func)};`;
        const generateProperty = (func: Units.TsProperty) => `${this.generateProperty(func)}`;

        const generateBehaviorMethod = (func: Units.TsFunction) => {
            let params = [`"${func.name}"`].concat(func.parameters.map(p => p.name)).join(", ");
            let body = "";
            if (func.returnType != Types.TsVoidType) {
                let returnType = this.getFunctionReturnType(func);
                body = `${ExecutionEnginePropertyName}.EvaluateMethod<${returnType}>(this, ${params})`;
            } else {
                body = `${ExecutionEnginePropertyName}.ExecuteMethod(this, ${params})`;
            }

            return (
                `public ${this.generateMethodSignature(func)} => ${body};`
            );
        };

        const partialInitializeMethodName = `Initialize${this.componentName}`;

        const generateComponentClass = () => {
            return (
                `public partial class ${this.componentName} : ${BaseComponentAliasName}, I${this.moduleName} {\n` +
                `\n` +
                `    public ${this.componentName}() : base(new ${this.moduleName}()) {\n` +
                `        ${partialInitializeMethodName}();\n` +
                `    }\n` +
                `\n` +
                `    partial void ${partialInitializeMethodName}();\n` +
                `\n` +
                `    protected new ${this.moduleName} ${mainModulePropertyName} => (${this.moduleName}) base.MainModule;\n` +
                `\n` +
                `    ${f(this.generateComponentWrapperBody(mainModulePropertyName))}\n` +
                `}`
            );
        };

        const formatEventName = (func: Units.TsFunction) => {
            // tracked events name is prefixed with # by convention
            return (this.trackableObjectsNames[this.getFunctionReturnType(func)] ? "#" : "") + func.name;
        };

        return (
            `public partial class ${this.moduleName} : ${BaseModuleAliasName}, I${this.moduleName} {\n` +
            `    \n` +
            `    ${f(this.generateNativeApi())}\n` +
            `    \n` +
            `    ${f(this.generateComponentBody(generatePropertyEvent, generateProperty, generateBehaviorMethod))}\n` +
            `    \n` +
            `    protected override string MainJsSource => \"${this.relativePath}\";\n` +
            `    protected override string NativeObjectName => \"${this.propsInterfaceCoreName}\";\n` +
            `    protected override string ModuleName => \"${this.filename}\";\n` +
            `    protected override object CreateNativeObject() => new ${PropertiesClassName}(this);\n` +
            `    protected override string[] Events => ${this.propsInterface ? `new string[] { ${this.propsInterface.functions.map(f => `"${formatEventName(f)}"`).join(",")} }` : ``};\n` +
            `    protected override ${keyValuePairType}[] PropertiesValues {\n` +
            `        get { \n` +
            `            return new ${keyValuePairType}[] {\n` +
            `    ${this.propsInterface ? f(this.propsInterface.properties.map(p => `            new ${keyValuePairType}("${p.name}", ${toPascalCase(p.name)})`).join(",\n")) : `` }\n` +
            `            };\n` +
            `        }\n` +
            `    }\n` +
            `    #if DEBUG\n` +
            `    protected override string Source => \"${this.fullPath}\";\n` +
            `    #endif\n` +
            `}\n` +
            `\n` +
            (this.isModule ? "" : generateComponentClass())
        );
    }

    private generateComponentInterface() {
        const generatePropertyEvent = (func: Units.TsFunction) => `${this.generatePropertyEvent(func, "")};`;
        const generateProperty = (prop: Units.TsProperty) => `${this.generateProperty(prop, "")}`;
        const generateBehaviorMethod = (func: Units.TsFunction) => `${this.generateMethodSignature(func)};`;

        const moduleInterfaceName = "I" + this.moduleName;

        let baseInterfaces: string[] = [];
        if (!this.isModule) {
            baseInterfaces.push(moduleInterfaceName);
        }
        if (this.baseComponentInterface) {
            baseInterfaces.push(this.baseComponentInterface);
        }

        return (
            `public partial interface ${moduleInterfaceName} {\n` +
            `    ${f(this.generateComponentBody(generatePropertyEvent, generateProperty, generateBehaviorMethod))}\n` +
            `}\n` +
            `\n` +
            `public partial interface I${this.componentName}${baseInterfaces.length > 0 ? " : " + baseInterfaces.join(",") : ""} {}`
        );
    }

    public generateComponent(emitComponentClass: boolean, emitComponentInterface: boolean, emitComponentAdapter: boolean, emitViewObjects: boolean) {
        if (!((this.component && this.behaviorsInterface && this.behaviorsInterface.functions.length > 0) ||
            (this.propsInterface && this.propsInterface.functions.length > 0))) {
            return "";
        }

        const generateAliases = () => {
            return (
                (this.isModule ? "" : `using ${BaseComponentAliasName} = ${this.baseComponentClass || "ReactViewControl.ReactView"};\n`) +
                `using ${BaseModuleAliasName} = ${this.baseModuleClass || "ReactViewControl.ViewModuleContainer"};\n` +
                (Object.entries(this.trackableObjectsNames).length > 0 ? `using ${TrackableInterfaceName} = ReactViewControl.${TrackableInterfaceName};` : "")
            );
        };

        const generatePropertyDelegate = (func: Units.TsFunction, accessibility: string = "public"): string => {
            accessibility = accessibility ? accessibility + " " : "";
            return `${accessibility}delegate ${this.generateMethodSignature(func, this.componentName, DelegateSuffix)}`;
        }

        const generatePropertiesDelegates = () => this.propsInterface ? this.propsInterface.functions.map(f => `${generatePropertyDelegate(f)};`).join("\n") : "";

        return (
            `${GeneratedFilesHeader}\n` +
            `${this.preamble}\n` +
            `namespace ${this.namespace} {\n` +
            `\n` +
            (emitComponentClass ? `    ${f(generateAliases())}\n\n` : ``) +
            (emitComponentInterface ? `    ${f(generatePropertiesDelegates())}\n\n` : ``) +
            (emitViewObjects ? `    ${f(this.generateNativeApiObjects())}\n\n` : "") +
            (emitComponentInterface ? `    ${f(this.generateComponentInterface())}\n\n` : ``) +
            (emitComponentClass ? `    ${f(this.generateComponentClass())}\n\n` : ``) +
            (emitComponentAdapter ? `    ${f(this.generateComponentAdapter())}\n\n` : ``) +
            `}`
        );
    }
}

function combinePath(path: string, rest: string) {
    return path + (path.endsWith("/") ? "" : "/") + (rest.startsWith("/") ? rest.substr(1) : rest);
}

export function transform(module: Units.TsModule, context: Object): string {
    debugger; // left on purpose to ease debugging
    const JsExtension = ".js";

    let namespace = context["namespace"];
    let baseDir = normalizePath(context["$baseDir"]);
    let fullPath = normalizePath(context["$fullpath"]);
    let javascriptDistPath = normalizePath(context["javascriptDistPath"] || "");

    let fileExtensionLen = fullPath.length - fullPath.lastIndexOf(".");
    let filenameWithoutExtension = fullPath.slice(fullPath.lastIndexOf("/") + 1, -fileExtensionLen);

    let output = normalizePath(context["$output"]);
    let javascriptRelativePath = combinePath(output, filenameWithoutExtension) + JsExtension;

    if (javascriptDistPath.endsWith(JsExtension)) {
        // dist path has extension... then its a complete filename, use as the output
        javascriptRelativePath = javascriptDistPath;
    } else {
        // else combine dist path with input filename
        javascriptRelativePath = combinePath(javascriptDistPath, javascriptRelativePath);
    }

    let javascriptFullPath = combinePath(baseDir, javascriptRelativePath); // add the base dir
    javascriptRelativePath = "/" + combinePath(namespace, javascriptRelativePath); // add the namespace

    output = combinePath(output, filenameWithoutExtension + ".Generated.cs");
    context["$output"] = output;
    
    let generator = new Generator(
        module,
        namespace,
        javascriptRelativePath,
        javascriptFullPath,
        filenameWithoutExtension,
        context["preamble"] || "",
        context["baseComponentClass"],
        context["baseModuleClass"],
        context["baseComponentInterface"],
        context["isModule"]
    );

    let emitComponent = context["emitComponent"] !== false;
    let emitComponentInterface = context["emitComponentInterface"] !== false;
    let emitComponentAdapter = context["emitComponentAdapter"] === true;
    let emitViewObjects = context["emitViewObjects"] !== false;

    return generator.generateComponent(emitComponent, emitComponentInterface, emitComponentAdapter, emitViewObjects);
}