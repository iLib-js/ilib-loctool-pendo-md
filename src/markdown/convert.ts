import fromMarkdown from "mdast-util-from-markdown";
import strikethrough from "mdast-util-gfm-strikethrough";
import toMarkdown from "mdast-util-to-markdown";
import syntax from "micromark-extension-gfm-strikethrough";

import type { Root } from "mdast";

export const parse = (markdown: string): Root =>
    fromMarkdown(markdown, {
        extensions: [syntax()],
        mdastExtensions: [strikethrough.fromMarkdown],
    });

export const stringify = (tree: Root): string => toMarkdown(tree, { extensions: [strikethrough.toMarkdown] });
