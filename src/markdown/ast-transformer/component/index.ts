import { fromComponents as baseFromComponents, toComponents as baseToComponents } from "./escape";
import { mapNodeToComponentData, mapComponentDataToNode } from "./mapping";

import type { Parent } from "mdast";
import type { ComponentData, ComponentList } from "./componentData";

// inject the component mapping into ast transform
const toComponents = <T extends Parent>(ast: T) => baseToComponents(ast, mapNodeToComponentData);
const fromComponents = <T extends Parent>(ast: T, components: ComponentList) =>
    baseFromComponents(ast, components, mapComponentDataToNode);

export { ComponentData, ComponentList };
export default {
    fromComponents,
    toComponents,
};
