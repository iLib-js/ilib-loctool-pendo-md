import { parse } from "../convert";

describe("Pendo Markdown Parser", () => {
    describe("basic markdown", () => {
        // basic markdown syntax which Pendo supports
        // i.e. bold, italic, link, ordered list (numbers), and unordered list (dash, asterisk, plus)
        // as per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
        it.each([
            ["bold", "**bold**"],
            ["italic (asterisk)", "*italic (asterisk)*"],
            ["italic (underscore)", "_italic (underscore)_"],
            ["link", "[link](https://example.com)"],
            ["ordered list", "1. ordered list"],
            ["unordered list (dash)", "- unordered list item 1\n- unordered list item 2\n- unordered list item 3"],
            ["unordered list (asterisk)", "* unordered list item 1\n* unordered list item 2\n* unordered list item 3"],
            ["unordered list (plus)", "+ unordered list item 1\n+ unordered list item 2\n+ unordered list item 3"],
        ])(`parses %s`, (_, value) => {
            const ast = parse(value);
            expect(ast).toMatchSnapshot();
        });
    });

    // custom Pendo extensions for markdown syntax
    // i.e. strikethrough, underline, and color
    // as per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
    describe("Pendo extended syntax", () => {
        describe("external libs", () => {
            // GFM-like strikethrough: `~~strikethrough~~`
            it("strikethrough", () => {
                const ast = parse("~~strikethrough~~");
                expect(ast).toMatchSnapshot();
            });
        });

        describe("custom extensions", () => {
            // underline: `++underline++`
            it("parses underline", () => {
                const ast = parse("++underline++");
                expect(ast).toMatchSnapshot();
            });

            // color: `{color: #000000}black{/color}`
            it.skip("parses color", () => {
                const ast = parse("{color: #000000}black{/color}");
                expect(ast).toMatchSnapshot();
            });
        });
    });
});
