import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { RuleSetRule } from "webpack";

// .sass / .scss / .css files
const SassRuleSet: RuleSetRule = {
    test: /\.(sa|sc|c)ss$/i,
    use: [
        {
            loader: MiniCssExtractPlugin.loader,
            options: {
                esModule: false,
            }
        },
        "@teamsupercell/typings-for-css-modules-loader",
        {
            loader: "css-loader",
            options: {
                esModule: false,
                modules: {
                    mode: "icss"
                }
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