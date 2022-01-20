import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { LoaderOptions } from "sass-loader/interfaces";
import { RuleSetRule } from "webpack";

const sassOptions: LoaderOptions = {
    sourceMap: true,
    s
    
}; 

// .sass / .scss / .css files
const SassRuleSet: RuleSetRule = {
    test: /\.(sa|sc|c)ss$/,
    use: [
        {
            loader: MiniCssExtractPlugin.loader,
            options: {
                esModule: false
            }
        },
        "@teamsupercell/typings-for-css-modules-loader",
        "css-loader",
        {
            loader: "css-loader",
            options:  {
                esModule: false,
                modules: true
            }

        },
        {
            loader: "resolve-url-loader",
            options: {
                keepQuery: true
            }
        },
        {
            loader: "sass-loader",
            options: {
                sourceMap: true,
                //sourceMapContents: false
            }
        }
    ]
};

export default SassRuleSet;