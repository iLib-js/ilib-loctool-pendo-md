// Based on https://github.com/syntax-tree/mdast-util-gfm-strikethrough/tree/0.2.3

import type { MdastExtension } from "mdast-util-from-markdown";
import type { Options } from "mdast-util-to-markdown";
import type { Parent, PhrasingContent } from "mdast";

import phrasing from "mdast-util-to-markdown/lib/util/container-phrasing";

const EXTENDED_NODE_TYPE = {
    UNDERLINE: "underline",
} as const;

const NODE_TYPE = {
    EMPHASIS: "emphasis",
} as const;

export interface Underline extends Parent {
    type: "underline";
    children: PhrasingContent[];
}

// extend available nodes in mdast
// as described in JSDoc of @types/mdast@3.0.15
declare module "mdast" {
    interface PhrasingContentMap {
        underline: Underline;
    }
}

const DELIM = "+";
const DOUBLE_DELIM = DELIM + DELIM;

export const fromMarkdown: MdastExtension = {
    // @ts-expect-error: as-is from mdast-util-gfm-strikethrough@0.2.3
    canContainEols: [EXTENDED_NODE_TYPE.UNDERLINE],
    enter: {
        underline: function (token) {
            // @ts-expect-error: as-is from mdast-util-gfm-strikethrough@0.2.3
            this.enter({ type: EXTENDED_NODE_TYPE.UNDERLINE, children: [] }, token);
        },
    },
    exit: {
        underline: function (token) {
            this.exit(token);
        },
    },
};

export const toMarkdown: Options = {
    unsafe: [{ character: DELIM, inConstruct: "phrasing" }],
    handlers: {
        [EXTENDED_NODE_TYPE.UNDERLINE]: function (node, _, context) {
            const exit = context.enter(NODE_TYPE.EMPHASIS);
            const value = phrasing(node, context, { before: DELIM, after: DELIM });
            exit();
            return DOUBLE_DELIM + value + DOUBLE_DELIM;
        },
    },
};

export default { fromMarkdown, toMarkdown };
