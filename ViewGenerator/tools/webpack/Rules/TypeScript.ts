import { cpus } from "os";
import { join, parse, resolve } from "path";
import { RuleSetRule, RuleSetUseItem } from "webpack";
import { removeDataTestIdTransformer } from "../Plugins/Utils";

// .ts / .tsx  files
const getTypeScriptRuleSet = (forHotReload: boolean): RuleSetRule => {

    const TypeScriptRule: RuleSetRule = {
        test: /\.tsx?$/i,
        exclude: /tests/
    };

    let ruleSet: RuleSetUseItem[] = [];

    let threadLoaderRule: RuleSetUseItem = {
        loader: "thread-loader",
        options: {
            // There should be 1 CPU available for the fork-ts-checker-webpack-plugin
            workers: cpus().length - 1
        }
    };

    let tsLoaderRule: RuleSetUseItem = {
        loader: "ts-loader",
        options: {
            happyPackMode: true,
            getCustomTransformers: join(__dirname, './CustomTransforms.js')
        }
    };

    // thread-loader, ts-loader
    TypeScriptRule.use = forHotReload ? ruleSet.concat(tsLoaderRule) : ruleSet.concat(threadLoaderRule, tsLoaderRule);
    return TypeScriptRule;
}

export default getTypeScriptRuleSet;
