import fromMarkdown from "mdast-util-from-markdown";
import strikethrough from "mdast-util-gfm-strikethrough";
import toMarkdown from "mdast-util-to-markdown";
import strikethroughSyntax from "micromark-extension-gfm-strikethrough";
import unistUtilRemovePosition from "unist-util-remove-position";
import underline from "./micromark-plugin/underline";
import colorString from "./string-transformer/color";
import colorAst from "./ast-transformer/color";
import unsupported from "./micromark-plugin/unsupported";

import type { Root } from "mdast";

export const parse = (markdown: string): Root => {
    // transform Pendo markdown Color tags to HTML tags which can later be processed through AST transformations
    const markdownWithColorAsHtml = colorString.toHtmlTags(markdown);

    // parse the markdown with the strikethrough and underline syntax extensions
    // (color nodes will show up as HTML nodes in the AST)
    const ast = fromMarkdown(markdownWithColorAsHtml, {
        extensions: [unsupported.syntax, strikethroughSyntax({ singleTilde: false }), underline.syntax()],
        mdastExtensions: [strikethrough.fromMarkdown, underline.mdastEstension.fromMarkdown],
    });

    // remove position data from the AST since it's not needed
    const astNoPosition = unistUtilRemovePosition(ast) as Root;

    // transform the AST to replace the HTML nodes with custom Color nodes
    const astWithColorNodes = colorAst.toColorNodes(astNoPosition);

    return astWithColorNodes;
};

export const stringify = (tree: Root): string => {
    // backconvert the custom Color nodes to HTML nodes
    const astNoColorNodes = colorAst.fromColorNodes(tree);

    // convert the AST to markdown with the strikethrough and underline syntax extensions
    // (unsupported syntax will be left as is since it is embedded in the AST as plain text)
    const markdown = toMarkdown(astNoColorNodes, {
        // note: we're passing mdast extensions here even though the name is `extensions` which in `fromMarkdown` is used for syntax extensions
        // this is verbatim from https://github.com/syntax-tree/mdast-util-gfm-strikethrough/tree/0.2.3?tab=readme-ov-file#use
        // and also fine according to the types
        extensions: [strikethrough.toMarkdown, underline.mdastEstension.toMarkdown],
    });

    // backconvert the HTML tags to Pendo markdown Color tags
    const markdownWithColorTags = colorString.fromHtmlTags(markdown);

    return markdownWithColorTags;
};
