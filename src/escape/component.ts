export interface Bold {
    type: "strong";
}

export interface Italic {
    type: "emphasis";
}

export interface Underline {
    type: "underline";
}

export interface Strikethrough {
    type: "delete";
}

export interface Link {
    type: "link";
    url: string;
}

export interface List {
    type: "list";
    ordered: boolean;
}

export interface ListItem {
    type: "listItem";
}

export interface Color {
    type: "color";
    value: string;
}

/**
 * Corresponds to a supported mdast node that is being substituted.
 */
export type Component = Bold | Italic | Underline | Strikethrough | Link | List | ListItem | Color;

/**
 * Sequence of components that are being substituted in the mdast tree
 * (in the order of tree traversal).
 */
export type ComponentList = Component[];
