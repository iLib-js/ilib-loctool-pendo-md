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
