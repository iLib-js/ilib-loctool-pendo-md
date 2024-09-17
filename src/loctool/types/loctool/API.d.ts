// per https://github.com/iLib-js/loctool/blob/201b56fc5a524ae578b55f582ff9b309010b4c3c/docs/Plugins.md#api-class
declare module "loctool" {
    /** the resource is a simple string */
    type ResTypeString = "string";

    /** the resource is an array of strings */
    type ResTypeArray = "array";

    /** the resource is a string with plural forms */
    type ResTypePlural = "plural";

    /**
     * the resource is a simple string with a context.
     * Strings in the different contexts may have the same content,
     * but are differentiated by their context.
     */
    type ResTypeContextString = "contextString";

    /**
     * the resource is a string from an iOS file.
     * These strings are handled slightly differently in that loctool
     * keeps track of the the source file where the string came from
     * originally so that it can write the translations to
     * appropriate .strings file.
     */
    type ResTypeIosString = "iosString";

    type ResType = ResTypeString | ResTypeArray | ResTypePlural | ResTypeContextString | ResTypeIosString;

    type NewResourceOptions = {
        resType: ResType;

        /** name of the project containing this resource */
        project?: string;

        /** the unique key of this resource */
        key?: string;

        /** the source locale of this resource */
        sourceLocale?: string;

        /**
         * the source string for the "string", "iosString"
         * and "contextString" resTypes
         */
        source?: string;

        /** the source array for the "array" resType */
        sourceArray?: string[];

        /**
         * an object mapping CLDR plural categories to
         * source strings for the "plural" resType
         */
        sourcePlurals?: Record<string, string>;

        /**
         * boolean value which is true when the key is
         * generated automatically from the source rather
         * than given explicitly.
         */
        autoKey?: boolean;

        /** path to the file where this resource was extracted */
        pathName?: string;

        /**
         * state of the current resource.
         * Almost always, plugins should report that the state is "new".
         */
        state?: string;

        /** translator's comment */
        comment?: string;

        /**
         * data type used in xliff files to identify strings
         * as having been extracted from this type of file
         * */
        datatype?: string;

        /** numerical index that gives the order of the strings in the source file. */
        index?: number;
    };

    type ResBundle = unknown;
    type APIUtils = unknown;

    export class API {
        /**
         * Return a new instance of a resource of the given type.
         * The options are passed to the resource subclass
         * constructor. The primary option is the "resType".
         *
         * @returns an instance of a resource subclass
         */
        newResource(options: NewResourceOptions): Resource;

        /**
         * Create a new translation set. A translation set is
         * a set of resources which contain meta-data about their
         * strings and the source and translated strings themselves.
         * A translation set may contain the same source phrase
         * multiple times if the meta-data is different because the
         * same phrase may be used in different ways in different
         * contexts of the application and thus may need a different
         * translation.<p>
         *
         * This is differentiated from a translation memory where
         * there are translations of source strings or phrases
         * without meta-data and possibly broken into shorter units.
         * A translation memory may also have multiple translations
         * for a particular source phrase, but which one should be
         * used for a particular source string in the application
         * is unclear because there is no meta-data associating
         * each translation with the source string.<p>
         *
         * The purpose of a translation memory is to aid a translator
         * in reusing translations that they have previous done
         * for consistency and speed of translation. The purpose
         * of a translation set is to denote which translations
         * are used for each source string in the application in
         * its idiosyncratic context.<p>
         *
         * The loctool uses translation sets to collect source strings
         * in the application and to represent translations of them.
         *
         * @param sourceLocale the locale spec of the
         * source locale. If not specified, the project's source
         * locale is used.
         * @returns a new translation set instance
         */
        newTranslationSet(sourceLocale?: string): TranslationSet;

        /**
         * Object containing some utility functions and data that the
         * plugin may need.
         */
        get utils(): APIUtils;

        /**
         * Return true if the given locale spec is for a pseudo-locale.
         * A pseudo-locale is one where an algorithm is applied
         * to the source text to create a pseudo-localization. This is
         * useful for localization enablement testing or font testing.
         *
         * @param locale the locale spec for the locale to test
         * @returns true if the given locale is a pseudo-locale
         * and false otherwise.
         */
        isPseudoLocale(locale: string): boolean;

        /**
         * Return a pseudo-translation resource bundle. This kind of
         * resource bundle applies a function over a source string to
         * produce a translated string. The resulting translated string
         * may be used for i18n testing or as an actual translation.
         *
         * @param locale the target locale of the pseudo bundle
         * @param filetype the file type of the file where
         *   the source strings are extracted from
         * @param project the project where the source
         *   strings are extracted from
         * @returns a resource bundle that automatically
         *   translates source strings
         */
        getPseudoBundle(locale: string, filetype: FileType, project: Project): ResBundle;

        /**
         * Return a FileType instance that represents the type of file
         * that is used as a resource file for the given source file
         * type. For example, Java source files use the properties files
         * as resource file types.
         * @param type the type of source file
         * @returns a file type instance that represents the
         *   resource file type for the given source file type
         */
        getResourceFileType(type: string): FileType;
    }
}
