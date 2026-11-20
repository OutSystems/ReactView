import { cpus } from "os";
import { join } from "path";
import { RuleSetRule, RuleSetUseItem } from "webpack";

// .ts / .tsx  files
const getTypeScriptRuleSet = (forHotReload: boolean, isProductionBuild: boolean): RuleSetRule => {

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

    // production strips data-test-id attributes; the dev server build registers components with react-refresh
    let customTransformers: string | null = null;
    if (isProductionBuild) {
        customTransformers = join(__dirname, "../Plugins/DataTestIdTransformerPlugin.js");
    } else if (forHotReload) {
        customTransformers = join(__dirname, "../Plugins/ReactRefreshTransformer.js");
    }

    let tsLoaderRule: RuleSetUseItem = {
        loader: "ts-loader",
        options: {
            happyPackMode: true,
            getCustomTransformers: customTransformers
        }
    };

    // thread-loader, ts-loader
    TypeScriptRule.use = forHotReload ? ruleSet.concat(tsLoaderRule) : ruleSet.concat(threadLoaderRule, tsLoaderRule);
    return TypeScriptRule;
}

export default getTypeScriptRuleSet;
