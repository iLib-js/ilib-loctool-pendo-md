import fromMarkdown from "mdast-util-from-markdown";
import strikethrough from "mdast-util-gfm-strikethrough";
import toMarkdown from "mdast-util-to-markdown";
import strikethroughSyntax from "micromark-extension-gfm-strikethrough";
import unistUtilRemovePosition from "unist-util-remove-position";
import underlineSyntax from "./plugin/underline/syntax";
import underline from "./plugin/underline/mdast";

import type { Root } from "mdast";

export const parse = (markdown: string): Root => {
    const ast = fromMarkdown(markdown, {
        extensions: [strikethroughSyntax({ singleTilde: false }), underlineSyntax()],
        mdastExtensions: [strikethrough.fromMarkdown, underline.fromMarkdown],
    });

    return unistUtilRemovePosition(ast) as Root;
};

export const stringify = (tree: Root): string =>
    toMarkdown(tree, { extensions: [strikethrough.toMarkdown, underline.toMarkdown] });
