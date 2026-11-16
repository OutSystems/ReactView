import TypeScript from "typescript";
import { removeDataTestIdTransformer } from "./Utils";

const dataTestIdTransformer: TypeScript.TransformerFactory<TypeScript.Node> = removeDataTestIdTransformer();

const getCustomTransformers = () => ({ 
    before: [dataTestIdTransformer]
});

module.exports = getCustomTransformers;