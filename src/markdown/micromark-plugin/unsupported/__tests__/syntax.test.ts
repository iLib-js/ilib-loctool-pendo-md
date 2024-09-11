import unsupportedSyntax from "../syntax";

import fromMarkdown from "mdast-util-from-markdown";
import unistUtilRemovePosition from "unist-util-remove-position";
import visit from "unist-util-visit";

import type { Root } from "mdast";
import type { Node } from "unist";

const getAstUsingUnsupportedSyntaxPlugin = (markdown: string) =>
    unistUtilRemovePosition(fromMarkdown(markdown, { extensions: [unsupportedSyntax] }), true) as Root;

const hasNode = (ast: Node, nodeType: string) => {
    let found = false;
    visit(ast, nodeType, () => {
        found = true;
        // stop processing
        return visit.EXIT;
    });

    return found;
};

// supported syntax per per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
describe("plugin/unsupported/syntax", () => {
    it.each([
        ["autolink", "https://example.com", "link"],
        ["blockquote", "> blockquote", "blockquote"],
        ["code fenced", "```\ncode\n```", "code"],
        ["code indented", "\tcode", "code"],
        ["code inline", "`code`", "inlineCode"],
        ["definition", "[term]: explanation", "definition"],
        ["header", "# header\n\nparaghaph text", "heading"],
        // @TODO also disable this after implementing the color syntax extension
        // ["html flow", "<div>html</div>", "html"],
        // ["html text", "text <div>html</div> text", "html"],
        ["image", "![alt text](https://example.com)", "image"],
        ["setext heading", "header\n---", "setextHeading"],
        ["thematic break", "---", "thematicBreak"],
    ])("should disable parsing of %s", (_, markdown, nodeType) => {
        const ast = getAstUsingUnsupportedSyntaxPlugin(markdown);

        expect(hasNode(ast, nodeType)).toBe(false);
    });

    it.each([
        ["italics (asterisk)", "*emphasis*", "emphasis"],
        ["italics (underscore)", "_emphasis_", "emphasis"],
        ["bold", "**strong**", "strong"],
        ["link", "[text](https://example.com)", "link"],
        ["unordered list", "- list item", "list"],
        ["ordered list", "1. list item", "list"],
    ])("should not disable parsing of %s", (_, markdown, nodeType) => {
        const ast = getAstUsingUnsupportedSyntaxPlugin(markdown);

        expect(hasNode(ast, nodeType)).toBe(true);
    });
});
