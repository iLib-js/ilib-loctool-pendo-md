/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging --
 * Intentional declaration merging per https://github.com/microsoft/TypeScript/issues/340
 * to carry over all properties and jsdoc from props definition to the class definition
 */
// per https://github.com/iLib-js/xliff/blob/f733c2a65a4215075c8a0b4f0c75aec289de6ae1/src/TranslationUnit.js
declare module "ilib-xliff" {
    type ResTypeString = "string";
    type ResTypeArray = "array";
    type ResTypePlural = "plural";
    type ResType = ResTypeString | ResTypeArray | ResTypePlural;

    type UnitStateNew = "new";
    type UnitStateTranslated = "translated";
    /** XLIFF Translation Unit states per https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#state */
    type UnitState = UnitStateNew | UnitStateTranslated;

    type Project = unknown;
    type Location = unknown;

    interface RequiredTranslationUnitProps {
        /** Source text for this unit */
        source: string;
        /** Source locale spec for this unit */
        sourceLocale: string;
        /** Unique resource key for this translation unit */
        key: string;
        /** Path to the original source code file that contains the source text of this translation unit */
        file: string;
        /** Project that this string/unit is part of */
        project: Project;
    }

    interface OptionalTranslationUnitProps {
        /** Target text for this unit */
        target: string;
        /** Target locale spec for this unit */
        targetLocale: string;
        /** Type of this resource */
        resType: ResType;
        /** State of the current unit */
        state: UnitState;
        /** Translator's comment for this unit */
        comment: string;
        /** Source of the data of this unit */
        datatype: string;
        /** Flavor that this string comes from */
        flavor: string;
        /** Flag that tells whether to translate this unit */
        translate: boolean;
        /** Line and character location of the start of this translation unit in the xml representation of the file */
        location: Location;
    }

    interface TranslationUnit extends RequiredTranslationUnitProps, Partial<OptionalTranslationUnitProps> {}
    class TranslationUnit {
        /**
         * Construct a new translation unit
         *
         * @param options The options may be undefined, which represents a new, clean TranslationUnit instance.
         *     If the required properties {@link RequiredTranslationUnitProps} are not given, the constructor throws an exception.
         *     For newly extracted strings, there is no target text yet. There must be a target
         *     locale for the translators to use when creating new target text, however. This
         *     means that there may be multiple translation units in a file with the same
         *     source locale and no target text, but different target locales.
         */
        // note: excluded the undefined options from typedef since this initializes an empty object, which is useless
        constructor(options: RequiredTranslationUnitProps & Partial<OptionalTranslationUnitProps>);

        /**
         * Return a shallow copy of this translation unit.
         */
        clone(): TranslationUnit;
    }
}
