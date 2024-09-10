import { toColorNodes } from "../color";

import type { Root } from "mdast";

describe("ast-transformer/color", () => {
    describe("toColorNodes", () => {
        it("should replace color nodes with XML-like nodes", () => {
            // from `normal text <color value="#000000">colored text</color> normal text`
            const parsed: Root = {
                type: "root",
                children: [
                    {
                        type: "paragraph",
                        children: [
                            {
                                type: "text",
                                value: "normal text ",
                            },
                            { type: "html", value: '<color value="#000000">' },
                            {
                                type: "text",
                                value: "colored text",
                            },
                            { type: "html", value: "</color>" },
                            { type: "text", value: " normal text" },
                        ],
                    },
                ],
            };
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
            expect(toColorNodes(parsed)).toEqual(expected);
        });
    });
});
