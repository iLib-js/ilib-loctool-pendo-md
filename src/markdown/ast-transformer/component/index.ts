import { fromComponents as baseFromComponents, toComponents as baseToComponents } from "./escape";
import { mapNodeToComponentData, mapComponentDataToNode } from "./mapping";

import type { Node } from "unist";
import type { ComponentData, ComponentList } from "./componentData";

// inject the component mapping into ast transform
const toComponents = (ast: Node) => baseToComponents(ast, mapNodeToComponentData);
const fromComponents = (ast: Node, components: ComponentList) =>
    baseFromComponents(ast, components, mapComponentDataToNode);

export { ComponentData, ComponentList };
export default {
    fromComponents,
    toComponents,
};
