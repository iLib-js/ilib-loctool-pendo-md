import u from "unist-builder";
import { mapNodeToComponentData, type ComponentData } from "../component";

describe("ast-transformer/component/component", () => {
    describe("mapNodeToComponentData", () => {
        it.each([
            ["strong", "strong"],
            ["emphasis", "emphasis"],
            ["underline", "underline"],
            ["delete", "delete"],
            ["link", "link"],
            ["list", "list"],
            ["listItem", "listItem"],
            ["color", "color"],
            ["html", "html"],
        ] as const)("maps mdast node %s to component data %s", (nodeType, componentType: ComponentData["type"]) => {
            const node = u(nodeType, []);
            expect(mapNodeToComponentData(node)?.type).toEqual(componentType);
        });

        it.each([
            "root",
            "paragraph",
            "text",
            "heading",
            "code",
            "inlineCode",
            "break",
            "blockquote",
            "table",
            "tableRow",
            "tableCell",
            "image",
        ] as const)("returns null for mdast node with no mapping %s", (nodeType) => {
            const node = u(nodeType, []);
            expect(mapNodeToComponentData(node)).toBeNull();
        });
    });
});
