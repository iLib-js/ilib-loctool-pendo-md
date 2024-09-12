import { toHtmlTags, fromHtmlTags } from "../color";

describe("string-transformer-color", () => {
    describe("toXmlTags", () => {
        it("should replace color tags with XML-like tags", () => {
            const markdown = "{color: #000000}colored text{/color}";
            const expected = '<color value="#000000">colored text</color>';
            expect(toHtmlTags(markdown)).toBe(expected);
        });

        it("should replace multiple color tags with XML-like tags", () => {
            const markdown =
                "regular text {color: #000000}colored text{/color} regular text {color: #ffffff}colored text{/color} regular text";
            const expected =
                'regular text <color value="#000000">colored text</color> regular text <color value="#ffffff">colored text</color> regular text';
            expect(toHtmlTags(markdown)).toBe(expected);
        });

        // not sure if Pendo supports nested color tags
        it("should replace nested color tags with XML-like tags", () => {
            const markdown =
                "{color: #000000}colored text {color: #ffffff}nested colored text{/color} nested colored text{/color}";
            const expected =
                '<color value="#000000">colored text <color value="#ffffff">nested colored text</color> nested colored text</color>';
            expect(toHtmlTags(markdown)).toBe(expected);
        });

        it("should replace adjacent color tags with XML-like tags", () => {
            const markdown = "{color: #000000}colored text{/color}{color: #ffffff}colored text{/color}";
            const expected = '<color value="#000000">colored text</color><color value="#ffffff">colored text</color>';
            expect(toHtmlTags(markdown)).toBe(expected);
        });
    });
    describe("fromHtmlTags", () => {
        it("should replace XML-like tags with color tags", () => {
            const xml = '<color value="#000000">colored text</color>';
            const expected = "{color: #000000}colored text{/color}";
            expect(fromHtmlTags(xml)).toBe(expected);
        });

        it("should replace multiple XML-like tags with color tags", () => {
            const xml =
                'regular text <color value="#000000">colored text</color> regular text <color value="#ffffff">colored text</color> regular text';
            const expected =
                "regular text {color: #000000}colored text{/color} regular text {color: #ffffff}colored text{/color} regular text";
            expect(fromHtmlTags(xml)).toBe(expected);
        });

        // not sure if Pendo supports nested color tags
        it("should replace nested XML-like tags with color tags", () => {
            const xml =
                '<color value="#000000">colored text <color value="#ffffff">nested colored text</color> nested colored text</color>';
            const expected =
                "{color: #000000}colored text {color: #ffffff}nested colored text{/color} nested colored text{/color}";
            expect(fromHtmlTags(xml)).toBe(expected);
        });

        it("should replace adjacent XML-like tags with color tags", () => {
            const xml = '<color value="#000000">colored text</color><color value="#ffffff">colored text</color>';
            const expected = "{color: #000000}colored text{/color}{color: #ffffff}colored text{/color}";
            expect(fromHtmlTags(xml)).toBe(expected);
        });
    });
});
