import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import { Compiler } from "webpack";
import { customErrorFormatter, getCurrentDirectory } from "./Utils";

export default class ForkTsCheckerWebpackFormatterPlugin extends ForkTsCheckerWebpackPlugin{
    // this extension adds a error output formatter so that VS can parse and show the errors on error list
    public apply(compiler: Compiler) {
        super.apply(compiler);

        const currentDirectory: string = getCurrentDirectory();

        const hooks = ForkTsCheckerWebpackFormatterPlugin.getCompilerHooks(compiler);

        hooks.issues.tap("ForkTsCheckerWebpackFormatterPlugin", (issues => {
            issues.map(issue => console.log(customErrorFormatter(issue, true, currentDirectory)));
            return issues;
        }))
    }
}