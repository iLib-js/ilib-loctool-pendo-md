import visit from "unist-util-visit";

import type { Content, Parent, HTML } from "mdast";

export interface Color extends Parent {
    type: "color";
    value: string;
}

// extend available nodes in mdast
// as described in JSDoc of @types/mdast@3.0.15
declare module "mdast" {
    interface BlockContentMap {
        Color: Color;
    }
}

const openingTag = /^<color value="(#[a-fA-F0-9]{6})">$/;
const closingTag = /^<\/color>$/;

/**
 * Transform AST to create custom nodes for color by consuming
 * nodes between specified HTML nodes.
 *
 * Given the following string:
 * ```markdown
 * <color value="#000000">colored text</color>
 * ```
 * parser will produce HTML nodes for the color tags.
 *
 * This function will transform the AST by reducing the HTML opening and closing tags
 * to a single custom node `Color`. It will hold the color value and contain children nodes
 * which are all siblings between the opening and closing tags.
 *
 */
export const toColorNodes = <T extends Parent>(root: T): T => {
    visit(root, "html", (node: HTML, index, parent) => {
        // only process if the node has siblings
        if (!parent) {
            return;
        }

        // only process after encountering an opening tag
        if (!openingTag.test(node.value)) {
            return;
        }
        const colorValue = node.value.match(openingTag)![1];

        // locate the matching closing tag sibling
        let closingIndex = undefined;

        // make sure to find the balanced closing tag
        // by increasing the nested level for each opening tag (starting from 1)
        // and decreasing it for each closing tag
        // when the level reaches 0, we have found the sibling index for matching closing tag
        // with that we can create a new Color node whose children are all the nodes between the opening and closing tags
        // (excluding the opening and closing tags)
        // potential inner color tags will be processed recursively
        // @TODO performance could be improved since deep nesting will result in multiple passes
        let level = 1;
        let i = index;
        while (++i < parent.children.length) {
            const nextNode = parent.children[i];
            // verify that the next node is an HTML node
            if (nextNode.type !== "html") {
                continue;
            }

            const nextValue = (nextNode as HTML).value;

            // check if it is another opening tag
            if (openingTag.test(nextValue)) {
                level++;
                continue;
            }

            // check if it is a closing tag
            if (closingTag.test(nextValue)) {
                level--;
                if (level === 0) {
                    // found the matching closing tag
                    closingIndex = i;
                    break;
                }
            }
        }

        // @TODO warn about unbalanced tags
        // if (closingIndex === null) {
        // }

        // create a new Color node
        // when closingIndex is undefined, it means the closing tag was not found
        // we'll recover by consuming all the remaining siblings
        const children = parent.children.slice(index + 1, closingIndex) as Content[];
        const colorNode: Color = {
            type: "color",
            children,
            value: colorValue,
        };

        // replace all the nodes between the opening and closing tags with the new Color node
        const deleteCount =
            1 + // opening tag
            children.length + // children nodes
            (closingIndex === undefined ? 0 : 1); // closing tag

        parent.children.splice(index, deleteCount, colorNode);

        // remaining siblings and/or nested color tags will be processed recursively
        return index;
    });
    return root;
};
