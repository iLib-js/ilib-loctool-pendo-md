import type { ComponentList } from "../../ast-transformer/component";
import { backconvert, convert } from "../convert";

describe("markdown/convert", () => {
    describe("convert", () => {
        it("should escape markdown syntax using components", () => {
            const markdown = `string with *emphasis*, ++underline++, {color: #FF0000}colored text{/color} and [a link](https://example.com)`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [escaped, _] = convert(markdown);

            expect(escaped).toBe(
                `string with <c0>emphasis</c0>, <c1>underline</c1>, <c2>colored text</c2> and <c3>a link</c3>`,
            );
        });

        it("should output data about components", () => {
            const markdown = `string with *emphasis*, ++underline++, {color: #FF0000}colored text{/color} and [a link](https://example.com)`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, components] = convert(markdown);

            expect(components).toEqual([
                { type: "emphasis" },
                {
                    type: "underline",
                },
                {
                    type: "color",
                    value: "#FF0000",
                },
                {
                    type: "link",
                    url: "https://example.com",
                },
            ]);
        });
    });

    describe("backconvert", () => {
        it("should backconvert escaped string to markdown syntax", () => {
            const escaped = `string with <c0>emphasis</c0>, <c1>underline</c1>, <c2>colored text</c2> and <c3>a link</c3>`;
            const components: ComponentList = [
                { type: "emphasis" },
                {
                    type: "underline",
                },
                {
                    type: "color",
                    value: "#FF0000",
                },
                {
                    type: "link",
                    url: "https://example.com",
                },
            ];

            const backconverted = backconvert(escaped, components);

            expect(backconverted).toBe(
                `string with *emphasis*, ++underline++, {color: #FF0000}colored text{/color} and [a link](https://example.com)`,
            );
        });
    });
});
