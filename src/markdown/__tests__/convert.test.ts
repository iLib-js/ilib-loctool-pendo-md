import { parse } from "../convert";
import visit from "unist-util-visit";

import type { List } from "mdast";
import type { Node } from "unist";

const expectToHaveNode = (ast: Node, nodeType: string) => {
    visit(ast, nodeType, (node) => {
        expect(node.type).toBe(nodeType);
    });

    expect.assertions(1);
};

describe("Pendo Markdown Parser", () => {
    describe("basic markdown", () => {
        // basic markdown syntax which Pendo supports
        // i.e. bold, italic, link, ordered list (numbers), and unordered list (dash, asterisk, plus)
        // as per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
        it.each([
            ["bold", "**bold**", "strong"],
            ["italic (asterisk)", "*italic (asterisk)*", "emphasis"],
            ["italic (underscore)", "_italic (underscore)_", "emphasis"],
            ["link", "[link](https://example.com)", "link"],
        ])(`parses %s`, (_, markdown, nodeType) => {
            const ast = parse(markdown);

            expectToHaveNode(ast, nodeType);
        });

        it.each([
            ["ordered list", "1. list item 1\n2. list item 2\n3. list item 3", true],
            ["unordered list (dash)", "- list item 1\n- list item 2\n- list item 3", false],
            ["unordered list (asterisk)", "* list item 1\n* list item 2\n* list item 3", false],
            ["unordered list (plus)", "+ list item 1\n+ list item 2\n+ list item 3", false],
        ])(`parses %s`, (_, markdown, ordered) => {
            const ast = parse(markdown);

            visit(ast, "list", (node: List) => {
                expect(node.type).toBe("list");
                expect(node.ordered).toBe(ordered);
                expect(node.children).toHaveLength(3);
            });

            expect.assertions(3);
        });
    });

    // custom Pendo extensions for markdown syntax
    // i.e. strikethrough, underline, and color
    // as per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
    describe("Pendo extended syntax", () => {
        describe("external libs", () => {
            // GFM-like strikethrough: `~~strikethrough~~`
            it("strikethrough", () => {
                const markdown = "~~strikethrough~~";
                const nodeType = "delete";

                const ast = parse(markdown);

                expectToHaveNode(ast, nodeType);
            });
        });

        describe("custom extensions", () => {
            // underline: `++underline++`
            it("parses underline", () => {
                const markdown = "++underline++";
                const nodeType = "underline";

                const ast = parse(markdown);

                expectToHaveNode(ast, nodeType);
            });

            // color: `{color: #000000}black{/color}`
            it.skip("parses color", () => {
                const markdown = "{color: #000000}black{/color}";
                const nodeType = "color";

                const ast = parse(markdown);

                expectToHaveNode(ast, nodeType);
            });
        });
    });
});
