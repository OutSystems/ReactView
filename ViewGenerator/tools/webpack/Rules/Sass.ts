﻿import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { RuleSetRule } from "webpack";

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
                sourceMap: true
            }
        }
    ]
};

export default SassRuleSet;