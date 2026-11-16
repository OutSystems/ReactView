import reactRefreshTypescript from "react-refresh-typescript";

/*
 * TypeScript transformer that registers components with react-refresh (the equivalent of react-refresh/babel for
 * ts-loader). Only used by the dev server build.
 * */
const getCustomTransformers = () => ({
    before: [reactRefreshTypescript()]
});

module.exports = getCustomTransformers;
