import type { Node as MNode } from "unist";
import type {
    Link as MLink,
    List as MList,
    HTML as MHTML,
    Emphasis as MEmphasis,
    Strong as MStrong,
    Delete as MDelete,
    ListItem as MListItem,
} from "mdast";

import type { Color as MColor } from "../color/color";
import type { Underline as MUnderline } from "../../micromark-plugin/underline";

interface BaseComponentData {
    type: string;
}

interface CBold extends BaseComponentData {
    type: "strong";
}

interface CItalic extends BaseComponentData {
    type: "emphasis";
}

interface CUnderline extends BaseComponentData {
    type: "underline";
}

interface CStrikethrough extends BaseComponentData {
    type: "delete";
}

interface CLink extends BaseComponentData {
    type: "link";
    url: string;
}

interface CList extends BaseComponentData {
    type: "list";
    ordered: boolean;
}

interface CListItem extends BaseComponentData {
    type: "listItem";
}

interface CColor extends BaseComponentData {
    type: "color";
    value: string;
}

interface CHTML extends BaseComponentData {
    type: "html";
    value: string;
}

/**
 * Possible component data types.
 */
interface ComponentDataMap {
    strong: CBold;
    emphasis: CItalic;
    underline: CUnderline;
    delete: CStrikethrough;
    link: CLink;
    list: CList;
    listItem: CListItem;
    color: CColor;
    html: CHTML;
}

/**
 * Holds data about substituted markdown syntax (i.e. mdast node) which allows it to be recreated later.
 */
export type ComponentData = ComponentDataMap[keyof ComponentDataMap];

/**
 * Sequence of components that were substituted in the mdast tree
 * (in the order of tree traversal).
 */
export type ComponentList = ComponentData[];

/**
 * Create a component data representation from a mdast node.
 *
 * This is used to remember what markdown syntax was escaped
 * by mapping from {@link MNode.type} to {@link ComponentData.type}. It also allows
 * to store additional data (like URL value for links) which should be blocked from translation
 * (i.e. not present in the escaped string).
 */
export const mapNodeToComponentData = (node: MNode): ComponentData | null => {
    switch (node.type) {
        // basic wrapping nodes
        case "strong":
        case "emphasis":
        case "underline":
        case "delete":
            return { type: node.type };
        // link node is also wrapping (over the link label), but we need to keep the URL -
        case "link":
            return { type: "link", url: (node as MLink).url };
        // list nodes are block-level, so they should become `<c0><c1>item</c1></c0>`
        case "list":
            return { type: "list", ordered: (node as MList).ordered ?? false };
        // list items only wrap the content, so they should become `<c0>item</c0>`
        case "listItem":
            return { type: "listItem" };
        // color node is a span-level node, so it should become `<c0>text</c0>` with a color attribute
        case "color":
            return { type: "color", value: (node as MColor).value };
        case "html":
            return { type: "html", value: (node as MHTML).value };
        // ignore other nodes
        default:
            return null;
    }
};

/**
 * Recreate a mdast node from a component data representation.
 *
 * This is used to convert the escaped syntax back to a proper mdast tree node.
 * It is the inverse of {@link mapNodeToComponentData}.
 */
export const mapComponentDataToNode = (component: ComponentData) => {
    switch (component.type) {
        case "strong":
            return { type: "strong", children: [] } as MStrong;
        case "emphasis":
            return { type: "emphasis", children: [] } as MEmphasis;
        case "underline":
            return { type: "underline", children: [] } as MUnderline;
        case "delete":
            return { type: "delete", children: [] } as MDelete;
        case "link":
            return { type: "link", url: component.url, children: [] } as MLink;
        case "list":
            return { type: "list", ordered: component.ordered, children: [] } as MList;
        case "listItem":
            return { type: "listItem", children: [] } as MListItem;
        case "color":
            return { type: "color", value: component.value, children: [] } as MColor;
        case "html":
            return { type: "html", value: component.value } as MHTML;
        default:
            // @ts-expect-error this should be an exhaustive check
            throw new Error(`Unknown component type: ${component.type}`);
    }
};
