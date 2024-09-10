import { toXmlTags, toMarkdown } from "../color";

describe("transformer/color/string", () => {
    describe("toXmlTags", () => {
        it("should replace color tags with XML-like tags", () => {
            const markdown = "{color: #000000}colored text{/color}";
            const expected = '<color value="#000000">colored text</color>';
            expect(toXmlTags(markdown)).toBe(expected);
        });
    });
    describe("toMarkdown", () => {
        it("should replace XML-like tags with color tags", () => {
            const xml = '<color value="#000000">colored text</color>';
            const expected = "{color: #000000}colored text{/color}";
            expect(toMarkdown(xml)).toBe(expected);
        });
    });
});
