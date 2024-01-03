import { removeDataTestIdTransformer } from "../Plugins/Utils";

const styledComponentsTransformer = removeDataTestIdTransformer();

const getCustomTransformers = () => ({ before: [styledComponentsTransformer] });

module.exports = getCustomTransformers;