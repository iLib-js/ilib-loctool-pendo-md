import visit from "unist-util-visit";
import { Component, ComponentList } from "./component";
import structuredClone from "@ungap/structured-clone";

import type { Node } from "unist";
import type { Root, Link, List, HTML, Emphasis, Strong, Delete, ListItem, Content } from "mdast";
import type { Color } from "../markdown/ast-transformer/color";
import type { Underline } from "../markdown/micromark-plugins/underline";

/**
 * Create a component to represent a mdast node.
 */
const mapNodeToComponent = (node: Node): Component | null => {
    switch (node.type) {
        // basic wrapping nodes - should become `<c0>text</c0>`
        case "strong":
        case "emphasis":
        case "underline":
        case "delete":
            return { type: node.type };
        // link node is also wrapping (over the link label), but we need to keep the URL
        case "link":
            return { type: "link", url: (node as Link).url };
        // list nodes are block-level, so they should become `<c0><c1>item</c1></c0>`
        case "list":
            return { type: "list", ordered: (node as List).ordered ?? false };
        // list items only wrap the content, so they should become `<c0>item</c0>`
        case "listItem":
            return { type: "listItem" };
        // color node is a span-level node, so it should become `<c0>text</c0>` with a color attribute
        case "color":
            return { type: "color", value: (node as Color).value };
        // ignore other nodes
        default:
            return null;
    }
};

/**
 * Recreate a mdast node from a component.
 */
const mapComponentToNode = (component: Component) => {
    switch (component.type) {
        case "strong":
            return { type: "strong" } as Strong;
        case "emphasis":
            return { type: "emphasis" } as Emphasis;
        case "underline":
            return { type: "underline" } as Underline;
        case "delete":
            return { type: "delete" } as Delete;
        case "link":
            return { type: "link", url: (component as Link).url } as Link;
        case "list":
            return { type: "list", ordered: (component as List).ordered } as List;
        case "listItem":
            return { type: "listItem" } as ListItem;
        case "color":
            return { type: "color", value: (component as Color).value } as Color;
        default:
            // @ts-expect-error exhaustive check
            throw new Error(`Unknown component type: ${component.type}`);
    }
};

/**
 * Given a mdast tree, traverse it looking for
 * Nodes which need to be substituted.
 *
 * Transform the tree by replacing all such nodes
 * with HTML components `<c0></c0>` or `<c0/>`.
 *
 * Additionally, keep track of replaced {@link Component} types in a map,
 * so that they can be backconverted to mdast nodes later.
 *
 * For example, the following markdown:
 * ```markdown
 * text **bold** [linklabel](https://example.com) *italic*
 * ```
 *
 * will be transformed to
 * ```markdown
 * text <c0>bold</c0> <c1>linklabel</c1> <c2>italic</c2>
 * ```
 *
 * and produce the following components:
 * ```typescript
 * [
 *    { type: "strong" },
 *    { type: "link", url: "https://example.com" },
 *    { type: "emphasis" }
 * ]
 * ```
 *
 * @returns A tuple containing the transformed mdast tree and the substituted component.
 */
export const toComponents = (ast: Root) => {
    // clone the tree
    const transformed = structuredClone(ast);

    // sequence of components which are substituted
    const components = [] as Component[];

    visit(transformed, (node, index, parent) => {
        // only process if the node has siblings
        if (!parent) {
            return visit.CONTINUE;
        }

        const component = mapNodeToComponent(node);

        // no mapping needed
        if (!component) {
            return visit.CONTINUE;
        }

        // store a component for the node
        components.push(component);
        const componentIndex = components.length - 1;

        // wrap the node with sibling HTML components corresponding to the component index
        parent.children.splice(
            index,
            1,
            {
                type: "html",
                value: `<c${componentIndex}>`,
            } as HTML,
            ...("children" in node ? (node.children as Node[]) : []),
            { type: "html", value: `</c${componentIndex}>` } as HTML,
        );

        // skip ahead to after the closing tag
        return index + 2;
    });

    return [transformed, components as ComponentList] as const;
};

/**
 * Backconverts the escaped AST (with components) to the original AST
 * using previosly substituted components.
 */
export const fromComponents = (escapedAst: Root, components: ComponentList) => {
    // clone the tree
    const transformed = structuredClone(escapedAst);

    visit(transformed, "html", (node: HTML, index, parent) => {
        // only process if the node has siblings
        if (!parent) {
            return visit.CONTINUE;
        }

        // check if it's a component opening node
        const match = node.value.match(/<c(\d+)>/);
        if (!match) {
            return visit.CONTINUE;
        }

        // locate the closing tag
        const closingIndex = parent.children.findIndex(
            (child, i) => i > index && child.type === "html" && (child as HTML).value === `</c${match[1]}>`,
        );

        if (closingIndex === -1) {
            // @TODO warn about missing closing tag

            // don't replace this component
            return visit.CONTINUE;
        }

        // get the component index
        const componentIndex = Number(match[1]);
        const component = components[componentIndex];

        // recreate the original mdast node
        const newNode = mapComponentToNode(component);

        // replace HTML nodes span with the original mdast node
        // and put nodes from between the opening and closing tags
        newNode.children = parent.children.slice(index + 1, closingIndex) as Content[];
        parent.children.splice(index, closingIndex - index + 1, newNode);
    });

    return transformed;
};
