import { toColorNodes } from "../color";

import fromMarkdown from "mdast-util-from-markdown";
import unistUtilRemovePosition from "unist-util-remove-position";

import type { Root } from "mdast";

const toAst = (markdown: string): Root => {
    return unistUtilRemovePosition(fromMarkdown(markdown)) as Root;
};

describe("ast-transformer/color", () => {
    describe("toColorNodes", () => {
        it("should reduce HTML color nodes to custom Color nodes", () => {
            const parsed = toAst('normal text <color value="#000000">colored text</color> normal text');

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
