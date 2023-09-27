import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { RuleSetRule } from "webpack";

// .sass / .scss / .css files
const SassRuleSet: RuleSetRule = {
    test: /\.(sa|sc|c)ss$/,
    use: [
        {
            loader: MiniCssExtractPlugin.loader,
        },
        "@teamsupercell/typings-for-css-modules-loader",
        {
            loader: "css-loader",
            options:  {
                modules: false
            }
        },
        {
            loader: "resolve-url-loader"
        },
        {
            loader: "sass-loader",
            options: {
                sassOptions: {
                    sourceMap: true,
                    sourceMapContents: false
                }
            }
        }
    ]
};

export default SassRuleSet;