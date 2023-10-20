import { cpus } from "os";
import { RuleSetRule, RuleSetUseItem } from "webpack";

// .ts / .tsx  files
const getTypeScriptRuleSet = (useCache: boolean): RuleSetRule => {

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
            happyPackMode: true
        }
    };

    // thread-loader, ts-loader
    TypeScriptRule.use = ruleSet.concat(threadLoaderRule, tsLoaderRule);
    return TypeScriptRule;
}

export default getTypeScriptRuleSet;
