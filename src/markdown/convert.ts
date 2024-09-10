import fromMarkdown from "mdast-util-from-markdown";
import strikethrough from "mdast-util-gfm-strikethrough";
import toMarkdown from "mdast-util-to-markdown";
import strikethroughSyntax from "micromark-extension-gfm-strikethrough";
import unistUtilRemovePosition from "unist-util-remove-position";
import underline from "./micromark-plugins/underline";
import color from "./string-transformer/color";
import unsupported from "./micromark-plugins/unsupported";

import type { Root } from "mdast";

export const parse = (markdown: string): Root => {
    const transformedMarkdown = color.toXmlTags(markdown);
    const ast = fromMarkdown(transformedMarkdown, {
        extensions: [unsupported.syntax, strikethroughSyntax({ singleTilde: false }), underline.syntax()],
        mdastExtensions: [strikethrough.fromMarkdown, underline.mdastEstension.fromMarkdown],
    });

    return unistUtilRemovePosition(ast) as Root;
};

export const stringify = (tree: Root): string => {
    const markdown = toMarkdown(tree, {
        // note: we're passing mdast extensions here even though the name is `extensions` which in `fromMarkdown` is used for syntax extensions
        // this is verbatim from https://github.com/syntax-tree/mdast-util-gfm-strikethrough/tree/0.2.3?tab=readme-ov-file#use
        // and also fine according to the types
        extensions: [strikethrough.toMarkdown, underline.mdastEstension.toMarkdown],
    });
    const backconvertedMarkdown = color.toMarkdown(markdown);
    return backconvertedMarkdown;
};
