import { parse, stringify } from "../convert";
import visit from "unist-util-visit";

import type { Root, List } from "mdast";
import type { Node } from "unist";

const hasNode = (ast: Node, nodeType: string) => {
    let found = false;
    visit(ast, nodeType, () => {
        found = true;
        // stop processing
        return visit.EXIT;
    });

    return found;
};

describe("Pendo Markdown converter", () => {
    describe("parse", () => {
        // basic markdown syntax which Pendo supports
        // i.e. bold, italic, link, ordered list (numbers), and unordered list (dash, asterisk, plus)
        // as per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
        describe("basic markdown", () => {
            it.each([
                ["bold", "**bold**", "strong"],
                ["italic (asterisk)", "*italic (asterisk)*", "emphasis"],
                ["italic (underscore)", "_italic (underscore)_", "emphasis"],
                ["link", "[link](https://example.com)", "link"],
            ])(`parses %s`, (_, markdown, nodeType) => {
                const ast = parse(markdown);

                expect(hasNode(ast, nodeType)).toBe(true);
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

                    expect(hasNode(ast, nodeType)).toBe(true);
                });
            });

            describe("custom extensions", () => {
                // underline: `++underline++`
                it("parses underline", () => {
                    const markdown = "++underline++";
                    const nodeType = "underline";

                    const ast = parse(markdown);

                    expect(hasNode(ast, nodeType)).toBe(true);
                });

                // color: `{color: #000000}black{/color}`
                it("parses color", () => {
                    const markdown = "{color: #000000}black{/color}";
                    const nodeType = "color";

                    const ast = parse(markdown);

                    expect(hasNode(ast, nodeType)).toBe(true);
                });
            });
        });
    });

    describe("stringify", () => {
        // custom Pendo extensions for markdown syntax
        // i.e. strikethrough, underline, and color
        // as per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
        describe("Pendo extended syntax", () => {
            describe("external libs", () => {
                // GFM-like strikethrough: `~~strikethrough~~`
                it("stringifies strikethrough", () => {
                    const markdown = "~~strikethrough~~";

                    const ast: Root = {
                        type: "root",
                        children: [
                            {
                                type: "paragraph",
                                children: [
                                    {
                                        type: "delete",
                                        children: [
                                            {
                                                type: "text",
                                                value: "strikethrough",
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    };

                    const stringified = stringify(ast);

                    // @TODO address the appended newline
                    const trimmedStringified = stringified.trimEnd();

                    expect(trimmedStringified).toEqual(markdown);
                });
            });

            describe("custom extensions", () => {
                // underline: `++underline++`
                it("stringifies underline", () => {
                    const markdown = "++underline++";

                    const ast: Root = {
                        type: "root",
                        children: [
                            {
                                type: "paragraph",
                                children: [
                                    {
                                        type: "underline",
                                        children: [
                                            {
                                                type: "text",
                                                value: "underline",
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    };

                    const stringified = stringify(ast);

                    // @TODO address the appended newline
                    const trimmedStringified = stringified.trimEnd();

                    expect(trimmedStringified).toEqual(markdown);
                });

                // color: `{color: #000000}black{/color}`
                it("stringifies color", () => {
                    const markdown = "{color: #000000}black{/color}";

                    const ast: Root = {
                        type: "root",
                        children: [
                            {
                                type: "paragraph",
                                children: [
                                    {
                                        type: "color",
                                        value: "#000000",
                                        children: [
                                            {
                                                type: "text",
                                                value: "black",
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    };

                    const stringified = stringify(ast);

                    // @TODO address the appended newline
                    const trimmedStringified = stringified.trimEnd();

                    expect(trimmedStringified).toEqual(markdown);
                });
            });
        });
    });
});
