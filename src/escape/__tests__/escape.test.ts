import u from "unist-builder";
import { fromComponents, toComponents } from "../escape";
import type { ComponentData } from "../component";

describe("escape", () => {
    describe("toComponents", () => {
        it("produces a list of escaped components", () => {
            // text **bold** [linklabel](https://example.com) *italic*
            const ast = u("root", [
                u("paragraph", [
                    u("text", "text "),
                    u("strong", [u("text", "bold")]),
                    u("text", " "),
                    u("link", { url: "https://example.com" }, [u("text", "linklabel")]),
                    u("text", " "),
                    u("emphasis", [u("text", "italic")]),
                ]),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, components] = toComponents(ast);

            // components:
            // 0: strong,
            // 1: link (value: https://example.com)
            // 2: emphasis
            const expected = [{ type: "strong" }, { type: "link", url: "https://example.com" }, { type: "emphasis" }];

            expect(components).toEqual(expected);
        });

        it("transforms the mdast tree", () => {
            // text **bold** [linklabel](https://example.com) *italic*
            const ast = u("root", [
                u("paragraph", [
                    u("text", "text "),
                    u("strong", [u("text", "bold")]),
                    u("text", " "),
                    u("link", { url: "https://example.com" }, [u("text", "linklabel")]),
                    u("text", " "),
                    u("emphasis", [u("text", "italic")]),
                ]),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [transformed, _] = toComponents(ast);

            // expect to get tree corresponding to the following converted string:
            // text <c0>bold</c0> <c1>linklabel</c1> <c2>italic</c2>
            const expected = u("root", [
                u("paragraph", [
                    u("text", "text "),
                    u("html", { value: "<c0>" }),
                    u("text", "bold"),
                    u("html", { value: "</c0>" }),
                    u("text", " "),
                    u("html", { value: "<c1>" }),
                    u("text", "linklabel"),
                    u("html", { value: "</c1>" }),
                    u("text", " "),
                    u("html", { value: "<c2>" }),
                    u("text", "italic"),
                    u("html", { value: "</c2>" }),
                ]),
            ]);
            expect(transformed).toEqual(expected);
        });
    });

    describe("fromComponents", () => {
        it("backconverts the escaped AST to the original AST", () => {
            // assume data converted from the following markdown:
            // text **bold** [linklabel](https://example.com) *italic*

            // components:
            // 0: strong,
            // 1: link (value: https://example.com)
            // 2: emphasis
            const components = [
                { type: "strong" },
                { type: "link", url: "https://example.com" },
                { type: "emphasis" },
            ] as ComponentData[];

            // converted string (further unmodified):
            // text <c0>bold</c0> <c1>linklabel</c1> <c2>italic</c2>
            const escapedAst = u("root", [
                u("paragraph", [
                    u("text", "text "),
                    u("html", { value: "<c0>" }),
                    u("text", "bold"),
                    u("html", { value: "</c0>" }),
                    u("text", " "),
                    u("html", { value: "<c1>" }),
                    u("text", "linklabel"),
                    u("html", { value: "</c1>" }),
                    u("text", " "),
                    u("html", { value: "<c2>" }),
                    u("text", "italic"),
                    u("html", { value: "</c2>" }),
                ]),
            ]);

            // backconvert the escaped AST to the original AST
            const backconverted = fromComponents(escapedAst, components);

            // expect to get tree matching the initial markdown
            // text **bold** [linklabel](https://example.com) *italic*
            const expected = u("root", [
                u("paragraph", [
                    u("text", "text "),
                    u("strong", [u("text", "bold")]),
                    u("text", " "),
                    u("link", { url: "https://example.com" }, [u("text", "linklabel")]),
                    u("text", " "),
                    u("emphasis", [u("text", "italic")]),
                ]),
            ]);

            expect(backconverted).toEqual(expected);
        });

        // actual case we want: backconvert translated escaped string
        it("backconverts components in shuffled escaped AST", () => {
            // initial markdown:
            // text **bold** [linklabel](https://example.com) *italic*

            // produces components:
            // 0: strong,
            // 1: link (value: https://example.com)
            // 2: emphasis
            const components = [
                { type: "strong" },
                { type: "link", url: "https://example.com" },
                { type: "emphasis" },
            ] as ComponentData[];

            // converted text (unmodified):
            // text <c1>linklabel</c1> <c0>bold</c0> <c2>italic</c2>

            // converted text (shuffled):
            // something <c1>linklabel</c1> <c0>bold</c0> <c2>italic</c2> different
            const shuffledTextAst = u("root", [
                u("paragraph", [
                    u("text", "something "),
                    u("html", { value: "<c1>" }),
                    u("text", "linklabel"),
                    u("html", { value: "</c1>" }),
                    u("text", " "),
                    u("html", { value: "<c0>" }),
                    u("text", "bold"),
                    u("html", { value: "</c0>" }),
                    u("text", " "),
                    u("html", { value: "<c2>" }),
                    u("text", "italic"),
                    u("html", { value: "</c2>" }),
                    u("text", " different"),
                ]),
            ]);

            // backconvert the escaped AST to the original AST
            const backconverted = fromComponents(shuffledTextAst, components);

            // expect to backconvert all escaped components in the shuffled text
            // i.e.
            // something [linklabel](https://example.com) **bold** *italic* different
            const expected = u("root", [
                u("paragraph", [
                    u("text", "something "),
                    u("link", { url: "https://example.com" }, [u("text", "linklabel")]),
                    u("text", " "),
                    u("strong", [u("text", "bold")]),
                    u("text", " "),
                    u("emphasis", [u("text", "italic")]),
                    u("text", " different"),
                ]),
            ]);

            expect(backconverted).toEqual(expected);
        });
    });
});
