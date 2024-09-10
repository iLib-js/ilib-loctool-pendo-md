import fromMarkdown from "mdast-util-from-markdown";
import strikethrough from "mdast-util-gfm-strikethrough";
import toMarkdown from "mdast-util-to-markdown";
import strikethroughSyntax from "micromark-extension-gfm-strikethrough";
import unistUtilRemovePosition from "unist-util-remove-position";
import underlineSyntax from "./plugin/underline/syntax";
import underline from "./plugin/underline/mdast";
import color from "./string-transformer/color";

import type { Root } from "mdast";

export const parse = (markdown: string): Root => {
    const transformedMarkdown = color.toXmlTags(markdown);
    const ast = fromMarkdown(transformedMarkdown, {
        extensions: [strikethroughSyntax({ singleTilde: false }), underlineSyntax()],
        mdastExtensions: [strikethrough.fromMarkdown, underline.fromMarkdown],
    });

    return unistUtilRemovePosition(ast) as Root;
};

export const stringify = (tree: Root): string => {
    const markdown = toMarkdown(tree, { extensions: [strikethrough.toMarkdown, underline.toMarkdown] });
    const backconvertedMarkdown = color.toMarkdown(markdown);
    return backconvertedMarkdown;
};
