import type { File, ResourceString, TranslationSet } from "loctool";
import { type TranslationUnit, Xliff } from "ilib-xliff";
import fs from "node:fs";
import { backconvert, convert } from "../markdown/convert";
import type { ComponentList } from "../markdown/ast-transformer/component";

/**
 * Properties of a single translation unit extracted from the XLIFF file which
 * are needed for further processing in loctool.
 */
export type TUData = { key: string; sourceLocale: string; source: string; comment?: string };

export class PendoXliffFile implements File {
    // @TODO logger

    /**
     * Path to the file being localized (i.e. source file).
     */
    private readonly sourceFilePath: string;

    /**
     * Parsed XLIFF file.
     *
     * Used during extraction to obtain translation units,
     * and later during localization to create a localized copy of it.
     */
    private xliff?: Xliff;

    /**
     * Modified translation units.
     *
     * This is a result of extracting translation units from the XLIFF file
     * and escaping their markdown syntax.
     *
     * Translation Units have modified source strings (escaped markdown syntax) and
     * modified comments (appended component descriptions).
     *
     * Such escaped TUs are output to loctool for translation after extraction.
     */
    private escapedUnits?: TranslationUnit[];

    /**
     * Data about markdown syntax escaped in corresponding source strings.
     *
     * This is used to backconvert localized strings to their original markdown syntax.
     *
     * It should map 1:1 to escaped units.
     */
    private componentLists?: ComponentList[];

    constructor(
        sourceFilePath: string,
        getLocalizedPath: typeof this.getLocalizedPath,
        getOuputLocale: typeof this.getOuputLocale,
        createTranslationSet: typeof this.createTranslationSet,
    ) {
        this.sourceFilePath = sourceFilePath;
        this.getLocalizedPath = getLocalizedPath;
        this.getOuputLocale = getOuputLocale;
        this.createTranslationSet = createTranslationSet;
    }

    private static loadXliff(path: string): Xliff {
        const content = fs.readFileSync(path, "utf-8");
        // @TODO switch to a different parser that supports CDATA
        // and does not prepend XML declaration
        const xliff = new Xliff();
        xliff.deserialize(content);

        // fixup for some unexpected default behavior of ilib-xliff
        xliff.getTranslationUnits().forEach((unit) => {
            // 1. Pendo files uses IDs for translation units, but ilib-xliff
            // does not use them as keys by default - instead it uses `resname` property
            // or generates a key based on the source string

            // @ts-expect-error -- untyped but exists
            // per https://github.com/iLib-js/xliff/blob/f733c2a65a4215075c8a0b4f0c75aec289de6ae1/src/Xliff.js#L832-L833
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            unit.key = unit.id;
        });

        return xliff;
    }

    /**
     * Escape markdown syntax in source strings of the supplied TUs
     * and insert escaped component descriptions into their comments.
     */
    private static toEscapedUnits(translationUnits: TranslationUnit[]) {
        return translationUnits.map((unit) => {
            // escape the source string and extract component list
            const [escapedSource, componentList] = convert(unit.source);

            if (componentList.length === 0) {
                // no components found, no need to modify the unit
                return [unit, componentList] as const;
            }

            // append description of all components to the unit comment
            // in the format: [c0: ComponentType, c1: ComponentType, ...]
            const componentComments = componentList
                .map((component, idx) => {
                    return `c${idx}: ${component.type}`;
                })
                .join(", ");
            const commentWithComponents = [unit.comment, `[${componentComments}]`].join(" ");

            // create a copy of the translation unit with changed source and comment
            const copy = unit.clone();
            copy.source = escapedSource;
            copy.comment = commentWithComponents;
            return [copy, componentList] as const;
        });
    }

    /** Datatype identifier for TUs containing Pendo markdown */
    private static readonly pendoGuideDatatype = "pendoguide";

    private static extractUnits(xliff: Xliff) {
        const translationUnits = xliff
            .getTranslationUnits()
            // accept only plain string translation units
            // (pendo should not have any other types of resources)
            // @TODO log warning for unsupported resource types
            .filter(
                (unit) =>
                    unit.datatype === undefined ||
                    (unit.datatype === PendoXliffFile.pendoGuideDatatype && unit.resType === "string") ||
                    undefined === unit.resType,
            );

        // units passed for further processing in loctool (e.g. creation of an output xliff file)
        // should have markdown syntax escaped
        return PendoXliffFile.toEscapedUnits(translationUnits);
    }

    /**
     * Create a deep copy of the supplied XLIFF object.
     */
    private static copyXliff(xliff: Xliff): Xliff {
        const copy = new Xliff();
        copy.deserialize(xliff.serialize());
        return copy;
    }

    extract(): void {
        this.xliff = PendoXliffFile.loadXliff(this.sourceFilePath);
        const escapedUnits = PendoXliffFile.extractUnits(this.xliff);

        // save the escaped units for extraction
        // and component lists for backconversion
        this.escapedUnits = escapedUnits.map(([unit]) => unit);
        this.componentLists = escapedUnits.map(([, componentList]) => componentList);
    }

    /**
     * Wraps translation units in loctool's ResourceString objects.
     *
     * This should be injected by the file type class which has access to loctool's API.
     */
    private readonly createTranslationSet: (units: TUData[]) => TranslationSet<ResourceString>;

    /**
     * Output source strings from the original Pendo XLIFF file as loctool resources
     * with escaped markdown syntax.
     */
    getTranslationSet(): TranslationSet {
        if (!this.escapedUnits) {
            throw new Error("Invalid operation: attempt to get translation set without extracting first.");
        }

        // note: conversion to loctool resources is done in injected createTranslationSet method
        // this is because loctool does not really care about translations per file,
        // since eventually it aggregates everything through FileType.getExtracted method
        // - injection allows for decoupling the file processing logic from the loctool API
        return this.createTranslationSet(this.escapedUnits);
    }

    /**
     * Given a source path and a locale, returns a path where the localized file should be written.
     *
     * This method should be injected by file type class and it should account for
     * - path template mapping (automatically identify path components like locale)
     * - locale mapping (if needed)
     */
    readonly getLocalizedPath: (loctoolLocale: string) => string;

    /**
     * Given a target locale (as provided by loctool), return the locale that should be used
     * in the output file.
     */
    private readonly getOuputLocale: (loctoolLocale: string) => string;

    /**
     * Given a set of translations provided by loctool, for each locale
     * write out a localized Pendo XLIFF file which is a copy of the source Pendo XLIFF but
     * with applicable translated strings inserted.
     */
    localize(translations: TranslationSet, loctoolLocales: string[]): void {
        if (!this.xliff || !this.escapedUnits || !this.componentLists) {
            throw new Error("Invalid operation: attempt to localize without extracting first.");
        }

        for (const loctoolLocale of loctoolLocales) {
            const translationsForLocale = translations
                .getAll()
                .filter(
                    (resource) => resource.getType() === "string" && resource.getTargetLocale() === loctoolLocale,
                ) as ResourceString[];

            // make a deep copy of the source xliff - don't mutate the file that's already loaded
            const xliffCopy = PendoXliffFile.copyXliff(this.xliff);

            // apply the locale mapping so that the file has expected target locale set
            const outputLocale = this.getOuputLocale(loctoolLocale);

            // note: no need to set target locale in the file itself, because
            // ilib-xliff does that based on the first available TU's target locale during serialization
            // per: https://github.com/iLib-js/xliff/blob/f733c2a65a4215075c8a0b4f0c75aec289de6ae1/src/Xliff.js#L299

            // mutate the translation units in the copy
            for (const [copyUnit, unitIdx] of xliffCopy
                .getTranslationUnits()
                .map((unit, unitIdx) => [unit, unitIdx] as const)) {
                // get translated string by matching TU ID
                const translation = translationsForLocale.find((resource) => resource.getKey() === copyUnit.key);
                if (!translation) {
                    // @TODO warn about missing translation
                    continue;
                }

                // get extracted component list based on TU index (it has to match since we're operating on a copy of the source xliff)
                const referenceComponentList = this.componentLists[unitIdx];
                if (!referenceComponentList) {
                    // @TODO warn about missing component list
                    continue;
                }

                // use the matching component source string as reference to reinsert the original markdown syntax
                // into the localized string
                try {
                    const target = translation.getTarget();
                    const unescapedTaget = backconvert(target, referenceComponentList);
                    // update the target string in the xliff
                    copyUnit.target = unescapedTaget;

                    // set target locale in the translation unit
                    // note: this is a mapped locale which can be different from the locale provided by loctool
                    copyUnit.targetLocale = outputLocale;

                    // set the translation state
                    copyUnit.state = "translated";
                } catch {
                    // @TODO log backconversion error
                }
            }

            // reverse fixup for ilib-xliff quirks
            xliffCopy.getTranslationUnits().forEach((unit) => {
                // 1. Pendo files uses IDs for translation units, but ilib-xliff
                // does not use them as keys by default - instead it uses `resname` property
                // or generates a key based on the source string

                // @ts-expect-error -- untyped but exists
                // per https://github.com/iLib-js/xliff/blob/f733c2a65a4215075c8a0b4f0c75aec289de6ae1/src/Xliff.js#L832-L833
                if (unit.key === unit.id) {
                    unit.key = "";
                }
            });

            // write out the localized xliff file
            const localizedFilePath = this.getLocalizedPath(loctoolLocale);
            fs.writeFileSync(localizedFilePath, xliffCopy.serialize(), { encoding: "utf-8" });
        }
    }

    write(): void {
        // no-op, as the localized files are written in the localize method
    }
}

export default PendoXliffFile;
