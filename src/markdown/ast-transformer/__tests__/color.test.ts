import { fromColorNodes, toColorNodes } from "../color";

import fromMarkdown from "mdast-util-from-markdown";
import unistUtilRemovePosition from "unist-util-remove-position";

import type { Root } from "mdast";

const toAst = (markdown: string): Root => {
    return unistUtilRemovePosition(fromMarkdown(markdown)) as Root;
};

describe("ast-transformer/color", () => {
    describe("toColorNodes", () => {
        it("should not modify the AST if there are no color nodes", () => {
            const parsedAst = toAst("normal text");

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [{ type: "text", value: "normal text" }],
                    },
                ],
            };

            const actual = toColorNodes(parsedAst);

            expect(actual).toEqual(expected);
        });

        it("should reduce HTML color nodes span to a custom Color node", () => {
            const parsedAst = toAst('normal text <color value="#000000">colored text</color> normal text');

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            {
                                type: "text",
                                value: "normal text ",
                            },
                            {
                                type: "color",
                                value: "#000000",
                                children: [
                                    {
                                        type: "text",
                                        value: "colored text",
                                    },
                                ],
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };

            const actual = toColorNodes(parsedAst);

            expect(actual).toEqual(expected);
        });

        it("should handle multiple color nodes", () => {
            const parsedAst = toAst(
                'normal text <color value="#000000">colored text</color> normal text <color value="#ffffff">colored text</color> normal text',
            );

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            { type: "text", value: "normal text " },
                            {
                                type: "color",
                                value: "#000000",
                                children: [{ type: "text", value: "colored text" }],
                            },
                            { type: "text", value: " normal text " },
                            {
                                type: "color",
                                value: "#ffffff",
                                children: [{ type: "text", value: "colored text" }],
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };

            const actual = toColorNodes(parsedAst);

            expect(actual).toEqual(expected);
        });

        // not sure if nesting is actully supported in Pendo
        it("should handle nested color nodes", () => {
            const parsedAst = toAst(
                'normal text <color value="#000000">colored text <color value="#ffffff">colored text</color></color> normal text',
            );

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            { type: "text", value: "normal text " },
                            {
                                type: "color",
                                value: "#000000",
                                children: [
                                    { type: "text", value: "colored text " },
                                    {
                                        type: "color",
                                        value: "#ffffff",
                                        children: [{ type: "text", value: "colored text" }],
                                    },
                                ],
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };

            const actual = toColorNodes(parsedAst);

            expect(actual).toEqual(expected);
        });

        it("should handle adjacent color nodes", () => {
            const parsedAst = toAst(
                'normal text <color value="#000000">colored text</color><color value="#ffffff">colored text</color> normal text',
            );

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            { type: "text", value: "normal text " },
                            {
                                type: "color",
                                value: "#000000",
                                children: [{ type: "text", value: "colored text" }],
                            },
                            {
                                type: "color",
                                value: "#ffffff",
                                children: [{ type: "text", value: "colored text" }],
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };

            const actual = toColorNodes(parsedAst);

            expect(actual).toEqual(expected);
        });
    });

    describe("fromColorNodes", () => {
        it("should backconvert custom Color nodes to HTML color nodes", () => {
            const ast = toAst('normal text <color value="#000000">colored text</color> normal text');
            const astWithColorNodes = toColorNodes(ast);

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            {
                                type: "text",
                                value: "normal text ",
                            },
                            {
                                type: "html",
                                value: '<color value="#000000">',
                            },
                            {
                                type: "text",
                                value: "colored text",
                            },
                            {
                                type: "html",
                                value: "</color>",
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };
            const actual = fromColorNodes(astWithColorNodes);

            expect(actual).toEqual(expected);
        });

        it("should backconvert multiple color nodes", () => {
            const ast = toAst(
                'normal text <color value="#000000">colored text</color> normal text <color value="#ffffff">colored text</color> normal text',
            );
            const astWithColorNodes = toColorNodes(ast);

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            { type: "text", value: "normal text " },
                            {
                                type: "html",
                                value: '<color value="#000000">',
                            },
                            { type: "text", value: "colored text" },
                            {
                                type: "html",
                                value: "</color>",
                            },
                            { type: "text", value: " normal text " },
                            {
                                type: "html",
                                value: '<color value="#ffffff">',
                            },
                            { type: "text", value: "colored text" },
                            {
                                type: "html",
                                value: "</color>",
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };
            const actual = fromColorNodes(astWithColorNodes);

            expect(actual).toEqual(expected);
        });

        // not sure if nesting is actully supported in Pendo
        it("should handle nested color nodes", () => {
            const ast = toAst(
                'normal text <color value="#000000">colored text <color value="#ffffff">colored text</color></color> normal text',
            );
            const astWithColorNodes = toColorNodes(ast);

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            { type: "text", value: "normal text " },
                            {
                                type: "html",
                                value: '<color value="#000000">',
                            },
                            { type: "text", value: "colored text " },
                            {
                                type: "html",
                                value: '<color value="#ffffff">',
                            },
                            { type: "text", value: "colored text" },
                            {
                                type: "html",
                                value: "</color>",
                            },
                            {
                                type: "html",
                                value: "</color>",
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };
            const actual = fromColorNodes(astWithColorNodes);

            expect(actual).toEqual(expected);
        });

        it("should handle adjacent color nodes", () => {
            const ast = toAst(
                'normal text <color value="#000000">colored text</color><color value="#ffffff">colored text</color> normal text',
            );
            const astWithColorNodes = toColorNodes(ast);

            const expected = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            { type: "text", value: "normal text " },
                            {
                                type: "html",
                                value: '<color value="#000000">',
                            },
                            { type: "text", value: "colored text" },
                            {
                                type: "html",
                                value: "</color>",
                            },
                            {
                                type: "html",
                                value: '<color value="#ffffff">',
                            },
                            { type: "text", value: "colored text" },
                            {
                                type: "html",
                                value: "</color>",
                            },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };
            const actual = fromColorNodes(astWithColorNodes);

            expect(actual).toEqual(expected);
        });
    });
});
