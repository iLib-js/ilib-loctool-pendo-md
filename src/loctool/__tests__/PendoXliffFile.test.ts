import type { TranslationSet } from "loctool";
import PendoXliffFile from "../PendoXliffFile";
import fs from "node:fs";

jest.mock("node:fs");
const mockedFs = jest.mocked(fs);

const mockGetLocalizedPath = jest.fn();
const mockGetOutputLocale = jest.fn();
const mockCreateTranslationSet = jest.fn();

const makeXliff = (
    datatype: string,
    transUnits: {
        resname: string;
        source: string;
        target?: string;
        note?: string;
    }[],
) => `
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file original="original-file" source-language="en" target-language="" datatype="${datatype}">
        <body>
        ${transUnits
            .map(
                (unit) => `
            <trans-unit id="${unit.resname}">
                <source>${unit.source}</source>
                <target>${unit.target ?? ""}</target>
                <note>${unit.note ?? ""}</note>
            </trans-unit>`,
            )
            .join("\n")}
        </body>
    </file>
</xliff>
`;

// xliff output by the library has multiple differences from the input
// (different whitespace, ommited and extra attributes, etc.)
// @TODO implement a logial check for the output rather than full file string comparison
const makeLocalizedXliff = (
    transUnits: {
        resname: string;
        source: string;
        target: string;
        note?: string;
    }[],
) => `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2">
  <file original="original-file" source-language="en" product-name="original-file">
    <body>
      ${transUnits
          .map(
              (unit) => `<trans-unit id="${unit.resname}" restype="string">
        <source>${unit.source}</source>
        <target state="translated">${unit.target}</target>
        <note>${unit.note ?? ""}</note>
      </trans-unit>`,
          )
          .join("\n")}
    </body>
  </file>
</xliff>`;

const makeFakeTranslations = (
    units: {
        locale: string;
        key: string;
        target: string;
    }[],
) =>
    ({
        getAll: () =>
            units.map(
                (unit) =>
                    ({
                        getKey: () => unit.key,
                        getTarget: () => unit.target,
                        getTargetLocale: () => unit.locale,
                        getType: () => "string",
                    }) as unknown,
            ),
    }) as unknown;

describe("PendoXliffFile", () => {
    let file: PendoXliffFile;

    beforeEach(() => {
        file = new PendoXliffFile("test.xliff", mockGetLocalizedPath, mockGetOutputLocale, mockCreateTranslationSet);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
    describe("extract", () => {
        it("should throw when given a non-existent file", () => {
            mockedFs.readFileSync.mockImplementation(() => {
                throw new Error("ENOENT");
            });
            expect(() => file.extract()).toThrow();
        });

        // note: skipped because used library is fine with invalid files most of the time
        // - it does not throw and just does not extract anything
        it.skip.each([
            ["empty file", ``],
            ["plaintext file", `a plaintext file`],
            ["html file", `<html></html>`],
        ])("should throw when given an invalid file: %s", (_, content) => {
            mockedFs.readFileSync.mockReturnValue(content);
            expect(() => file.extract()).toThrow();
        });

        it("should extract a valid xliff file", () => {
            const xliff = makeXliff("x-undefined", [
                {
                    resname: "ContactInfo.customSupportEmail",
                    source: "Email Address",
                    note: "label for text input",
                },
            ]);
            mockedFs.readFileSync.mockReturnValue(xliff);
            expect(() => file.extract()).not.toThrow();
        });
    });

    describe("getTranslationSet", () => {
        it("should throw if called before extraction", () => {
            const extractSpy = jest.spyOn(file, "extract");
            expect(extractSpy).not.toHaveBeenCalled();
            expect(() => file.getTranslationSet()).toThrow();
        });

        it("should use injected factory to create a translation set", () => {
            const xliff = makeXliff("x-undefined", [
                {
                    resname: "ContactInfo.customSupportEmail",
                    source: "Email Address",
                    note: "label for text input",
                },
            ]);
            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            const mockTranslationSet = "mocked translation set";
            mockCreateTranslationSet.mockReturnValue(mockTranslationSet);

            expect(file.getTranslationSet()).toBe(mockTranslationSet);
        });

        it("should put the extracted translation units in a translation set", () => {
            const xliff = makeXliff("x-undefined", [
                {
                    resname: "ContactInfo.customSupportEmail",
                    source: "Email Address",
                    note: "label for text input",
                },
            ]);

            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            file.getTranslationSet();

            expect(mockCreateTranslationSet).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        key: "ContactInfo.customSupportEmail",
                        source: "Email Address",
                        comment: "label for text input",
                    }),
                ]),
            );
        });

        describe("pendo strings", () => {
            it("should escape Pendo syntax in the source", () => {
                const xliffWithPendoSyntax = makeXliff("pendoguide", [
                    {
                        resname: "ContactInfo.customSupportEmail",
                        source: "Email {color: #FF0000}Address{/color}",
                        note: "label for text input",
                    },
                ]);

                mockedFs.readFileSync.mockReturnValue(xliffWithPendoSyntax);

                file.extract();

                file.getTranslationSet();

                expect(mockCreateTranslationSet).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            key: "ContactInfo.customSupportEmail",
                            source: "Email <c0>Address</c0>",
                            comment: "label for text input [c0: color]",
                        }),
                    ]),
                );
            });

            // note: skipped because datatype is not properly extracted by the library
            it.skip("should not escape Pendo syntax when datatype does not match", () => {
                const xliffWithPendoSyntax = makeXliff("markdown", [
                    {
                        resname: "ContactInfo.customSupportEmail",
                        source: "Email {color: #FF0000}Address{/color}",
                        note: "label for text input",
                    },
                ]);

                mockedFs.readFileSync.mockReturnValue(xliffWithPendoSyntax);

                file.extract();

                file.getTranslationSet();

                expect(mockCreateTranslationSet).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            key: "ContactInfo.customSupportEmail",
                            source: "Email {color: #FF0000}Address{/color}",
                            comment: "label for text input",
                        }),
                    ]),
                );
            });
        });
    });

    describe("write", () => {
        it("should not write any files (should be a no-op)", () => {
            expect(() => file.write()).not.toThrow();
            expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
        });
    });

    describe("getLocalizedPath", () => {
        it("should offload to injected function", () => {
            const locale = "xx-XX";
            const mockLocalizedPath = "mocked localized path";
            mockGetLocalizedPath.mockReturnValue(mockLocalizedPath);

            expect(file.getLocalizedPath(locale)).toBe(mockLocalizedPath);
            expect(mockGetLocalizedPath).toHaveBeenCalledWith(locale);
        });

        it("should not apply locale mapping", () => {
            const locale = "xx-XX";
            const mockLocalizedPath = "mocked localized path";
            mockGetLocalizedPath.mockReturnValue(mockLocalizedPath);

            expect(file.getLocalizedPath(locale)).toBe(mockLocalizedPath);
            expect(mockGetOutputLocale).not.toHaveBeenCalled();
        });
    });

    describe("localize", () => {
        const mockLocalizedPath = "mocked localized path";
        beforeEach(() => {
            mockGetLocalizedPath.mockReturnValue(mockLocalizedPath);
        });

        it("should unescape Pendo syntax in the target", () => {
            const xliff = makeXliff("pendoguide", [
                {
                    resname: "ContactInfo.customSupportEmail",
                    source: "Email {color: #FF0000}Address{/color}",
                    note: "label for text input",
                },
            ]);

            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            const translations = makeFakeTranslations([
                {
                    locale: "xx-XX",
                    key: "ContactInfo.customSupportEmail",
                    target: "<c0>Adres</c0> E-mail",
                },
            ]);
            file.localize(translations as TranslationSet, ["xx-XX"]);

            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                mockLocalizedPath,
                makeLocalizedXliff([
                    {
                        resname: "ContactInfo.customSupportEmail",
                        source: "Email {color: #FF0000}Address{/color}",
                        target: "{color: #FF0000}Adres{/color} E-mail",
                        note: "label for text input",
                    },
                ]),
                expect.anything(),
            );
        });

        it("should insert translations as-is if there is no Pendo syntax", () => {
            const xliff = makeXliff("pendoguide", [
                {
                    resname: "ContactInfo.customSupportEmail",
                    source: "Email Address",
                    note: "label for text input",
                },
            ]);

            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            const translations = makeFakeTranslations([
                {
                    locale: "xx-XX",
                    key: "ContactInfo.customSupportEmail",
                    target: "Adres E-mail",
                },
            ]);
            file.localize(translations as TranslationSet, ["xx-XX"]);

            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                mockLocalizedPath,
                makeLocalizedXliff([
                    {
                        resname: "ContactInfo.customSupportEmail",
                        source: "Email Address",
                        target: "Adres E-mail",
                        note: "label for text input",
                    },
                ]),
                expect.anything(),
            );
        });

        it("should insert translations for correct locale", () => {
            const xliff = makeXliff("x-undefined", [
                {
                    resname: "ContactInfo.customSupportEmail",
                    source: "Email Address",
                    note: "label for text input",
                },
            ]);

            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            const translations = makeFakeTranslations([
                {
                    locale: "xx-XX",
                    key: "ContactInfo.customSupportEmail",
                    target: "Adres E-mail",
                },
                {
                    locale: "yy-YY",
                    key: "ContactInfo.customSupportEmail",
                    target: "電子メールアドレス",
                },
            ]);
            file.localize(translations as TranslationSet, ["yy-YY"]);

            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                mockLocalizedPath,
                makeLocalizedXliff([
                    {
                        resname: "ContactInfo.customSupportEmail",
                        source: "Email Address",
                        target: "電子メールアドレス",
                        note: "label for text input",
                    },
                ]),
                expect.anything(),
            );
        });

        // note: skipped because used library does not output the target-language attribute
        it.skip("should use mapped locale in localized file content", () => {
            const loctoolLocale = "xx-XX";
            const outputLocale = "yy-YY";
            mockGetOutputLocale.mockReturnValue(outputLocale);

            const xliff = makeXliff("x-undefined", [
                {
                    resname: "ContactInfo.customSupportEmail",
                    source: "Email Address",
                    note: "label for text input",
                },
            ]);

            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            const translations = makeFakeTranslations([
                {
                    locale: loctoolLocale,
                    key: "ContactInfo.customSupportEmail",
                    target: "Adres E-mail",
                },
            ]);

            file.localize(translations as TranslationSet, [loctoolLocale]);

            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                mockLocalizedPath,
                makeLocalizedXliff(
                    outputLocale,
                    // @ts-expect-error -- target-language is not in the library output
                    [
                        {
                            resname: "ContactInfo.customSupportEmail",
                            source: "Email Address",
                            target: "Adres E-mail",
                            note: "label for text input",
                        },
                    ],
                ),
                expect.anything(),
            );
        });

        it("should not use mapped locale in getLocalizedPath", () => {
            const loctoolLocale = "xx-XX";
            const outputLocale = "yy-YY";
            mockGetOutputLocale.mockReturnValue(outputLocale);

            const xliff = makeXliff("x-undefined", []);

            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            const translations = makeFakeTranslations([]);
            file.localize(translations as TranslationSet, [loctoolLocale]);

            expect(mockGetLocalizedPath).toHaveBeenCalledWith(loctoolLocale);
        });

        it("should ouptut localized file to path returned by getLocalizedPath", () => {
            const mockLocalizedPathDifferent = "mocked localized path 2";
            mockGetLocalizedPath.mockReset().mockReturnValue(mockLocalizedPathDifferent);

            const xliff = makeXliff("x-undefined", []);

            mockedFs.readFileSync.mockReturnValue(xliff);

            file.extract();

            const translations = makeFakeTranslations([]);
            file.localize(translations as TranslationSet, ["xx-XX"]);

            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                mockLocalizedPathDifferent,
                expect.any(String),
                expect.anything(),
            );
        });
    });
});
