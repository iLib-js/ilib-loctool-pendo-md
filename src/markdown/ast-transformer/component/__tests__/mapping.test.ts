import u from "unist-builder";
import { mapComponentDataToNode, mapNodeToComponentData } from "../mapping";
import type { ComponentData } from "..";

describe("ast-transformer-component/mapping", () => {
    describe("mdast -> component", () => {
        it.each([
            ["strong", "strong"],
            ["emphasis", "emphasis"],
            ["underline", "underline"],
            ["delete", "delete"],
            ["listItem", "listItem"],
        ] as const)(
            "maps mdast node %s to component data %s",
            (nodeType, expectedComponentType: ComponentData["type"]) => {
                const node = u(nodeType, [u("text", "text")]);
                const actual = mapNodeToComponentData(node);
                const expected = { type: expectedComponentType };
                expect(actual).toEqual(expected);
            },
        );

        it.each([["html", "html", { value: "<p>HTML</p>" }]] as const)(
            "maps mdast node with props %s to component data %s",
            (nodeType, expectedComponentType, expectedData) => {
                const node = u(nodeType, expectedData);
                const actual = mapNodeToComponentData(node);
                const expected = { type: expectedComponentType, ...expectedData };
                expect(actual).toEqual(expected);
            },
        );

        it.each([
            ["link", "link", { url: "http://example.com" }],
            ["list", "list", { ordered: true }],
            ["color", "color", { value: "#ff0000" }],
        ] as const)(
            "maps complex mdast node %s to component data %s",
            (nodeType, expectedComponentType, expectedData) => {
                const node = u(nodeType, expectedData, [u("text", "text")]);
                const actual = mapNodeToComponentData(node);
                const expected = { type: expectedComponentType, ...expectedData };
                expect(actual).toEqual(expected);
            },
        );

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
            "not-a-real-mdast-node",
        ] as const)("returns null for mdast node with no mapping %s", (nodeType) => {
            const node = u(nodeType, []);
            const actual = mapNodeToComponentData(node);
            expect(actual).toBeNull();
        });
    });

    describe("component -> mdast", () => {
        it.each([
            ["strong", "strong"],
            ["emphasis", "emphasis"],
            ["underline", "underline"],
            ["delete", "delete"],
            ["listItem", "listItem"],
        ] as const)("maps component data %s to simple mdast node %s", (componentType, expectedNodeType) => {
            const componentData = { type: componentType };
            const actual = mapComponentDataToNode(componentData);
            const expected = u(expectedNodeType, []);
            expect(actual).toEqual(expected);
        });

        it.each([["html", { value: "<p>HTML</p>" }, "html"]] as const)(
            "maps component data %s to mdast node with props %s",
            (componentType, componentProps, expectedNodeType) => {
                const componentData = { type: componentType, ...componentProps };
                const actual = mapComponentDataToNode(componentData);
                const expected = u(expectedNodeType, componentProps);
                expect(actual).toEqual(expected);
            },
        );

        it.each([
            ["link", { url: "http://example.com" }, "link"],
            ["list", { ordered: true }, "list"],
            ["color", { value: "#ff0000" }, "color"],
        ])("maps component data %s to complex mdast node %s", (componentType, componentProps, expectedNodeType) => {
            const componentData = { type: componentType, ...componentProps } as ComponentData;
            const actual = mapComponentDataToNode(componentData);

            const nodeProps = { ...componentProps };
            const expected = u(expectedNodeType, nodeProps, []);

            expect(actual).toEqual(expected);
        });
    });
});
