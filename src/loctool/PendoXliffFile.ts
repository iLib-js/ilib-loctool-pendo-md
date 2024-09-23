import type { API, File, Project, ResourceString, TranslationSet } from "loctool";
import { type TranslationUnit, Xliff } from "ilib-xliff";
import path from "node:path";
import fs from "node:fs";
import { backconvert, convert } from "../markdown/convert";

export class PendoXliffFile implements File {
    /**
     * Absolute path to the file being localized (i.e. source file).
     */
    private readonly absolutePath: string;

    /**
     * Reference to the loctool {@link Project} instance which uses this file type.
     */
    // @TODO don't use Project directly, make FileType inject the necessary data
    private readonly project: Project;

    /**
     * Additional functionality provided by loctool to the plugin.
     */
    // @TODO for testability, only inject selected API methods
    // @TODO logger
    private readonly loctoolAPI: API;

    // @TODO don't hold xliff in memory since it's not used after extraction
    /**
     * Field to hold loaded xliff file in memory. Use {@link xliff} getter to ensure a loded file.
     */
    private _xliff: Xliff | undefined;
    private set xliff(xliff: Xliff) {
        this._xliff = xliff;
    }
    /**
     * Structure of the underlying source XLIFF file.
     */
    private get xliff() {
        if (!this._xliff) {
            throw new Error("XLIFF file not loaded");
        }
        return this._xliff;
    }

    constructor(absolutePath: string, project: Project, loctoolAPI: API) {
        this.absolutePath = absolutePath;
        this.project = project;
        this.loctoolAPI = loctoolAPI;
    }

    get sourceLocale() {
        // Per convention (e.g. https://github.com/iLib-js/loctool/blob/285401359f923c1be11e7329b549ed11b4099637/lib/MarkdownFile.js#L130)
        // it seems that source locale should always come from the project
        return this.project.getSourceLocale();
    }

    getLocalizedPath(locale: string): string {
        // @TODO replace this with a throw "unsupported" error
        // to make sure this method is not called unintentionally by loctool;
        // instead, maybe inject a method to provide localized path

        // it looks like Loctool does not use this method currently
        // as of https://github.com/iLib-js/loctool/commit/285401359f923c1be11e7329b549ed11b4099637
        // since it seems to expect the plugin to write all localized files on its own
        // during {@link localize} method call

        const { dir, name, ext: extWithDot } = path.parse(this.absolutePath);

        // remove optional trailing source locale from filename
        let localizedName = name.replace(new RegExp(`_${this.sourceLocale}$`), "");

        // output the localized file in the same directory as the source file
        localizedName = localizedName.length > 0 ? `${localizedName}_${locale}` : locale;

        return path.join(dir, `${localizedName}${extWithDot}`);
    }

    private static loadXliff(path: string): Xliff {
        const content = fs.readFileSync(path, "utf-8");
        // @TODO switch to a different parser that supports CDATA
        // and does not prepend XML declaration
        const xliff = new Xliff();
        xliff.deserialize(content);
        return xliff;
    }

    extract(): void {
        this.xliff = PendoXliffFile.loadXliff(this.absolutePath);
    }

    /**
     * Escape markdown syntax in source strings of the supplied TUs
     * and insert escaped component descriptions into their comments.
     */
    private static toEscaped(translationUnits: TranslationUnit[]) {
        return translationUnits.map((unit) => {
            // escape the source string
            // @TODO refactor for testability
            // maybe extract the conversion logic into a separate class
            // and inject it into the file class
            const [escapedSource, componentList] = convert(unit.source);

            // append description of all components to the unit comment
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
            return copy;
        });
    }

    /**
     * Output source strings from the original Pendo XLIFF file as loctool resources
     * with escaped markdown syntax.
     */
    getTranslationSet() {
        const translationUnits = this.xliff
            // @TODO only allow xliffs where <file datatype="pendoguide">
            .getTranslationUnits()
            // accept only plain string translation units
            // (pendo should not have any other types of resources)
            // @TODO log warning for unsupported resource types
            .filter((unit) => unit.resType === "string" && undefined === unit.resType);

        // units passed for further processing in loctool (e.g. creation of an output xliff file)
        // should have markdown syntax escaped
        const escapedUnits = PendoXliffFile.toEscaped(translationUnits);

        // convert to loctool resources
        const resources = escapedUnits.map((unit) =>
            this.loctoolAPI.newResource({
                resType: "string",
                key: unit.key,
                sourceLocale: unit.sourceLocale,
                source: unit.source,
                comment: unit.comment,
                // not sure if this is used by loctool anywhere,
                // but it's required per the Resource interface definition
                project: this.project.getProjectId(),
            }),
        );
        // wrap in a translation set
        const translationSet = this.loctoolAPI.newTranslationSet<ResourceString>(this.sourceLocale);
        translationSet.addAll(resources);

        return translationSet;
    }

    /**
     * Given a set of translations provided by loctool, for each locale
     * write out a localized Pendo XLIFF file which is a copy of the source Pendo XLIFF but
     * with applicable translated strings inserted.
     */
    localize(translations: TranslationSet, locales: string[]): void {
        for (const locale of locales) {
            // @TODO handle locale mapping
            // and add note about the fact that the locale mapping should be handled
            // by loctool rather than each plugin separately
            const translationsForLocale = translations
                .getAll()
                .filter(
                    (resource) => resource.getType() === "string" && resource.getTargetLocale() === locale,
                ) as ResourceString[];

            // load a copy of the source xliff - don't mutate the file that's already loaded
            const xliff = PendoXliffFile.loadXliff(this.absolutePath);
            // mutate the translation units in the copy
            for (const unit of xliff.getTranslationUnits()) {
                const translation = translationsForLocale.find((resource) => resource.getKey() === unit.key);
                if (!translation) {
                    // @TODO warn about missing translation
                    continue;
                }

                // use the source string as reference to reinsert the original markdown syntax
                // into the localized string
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [_, referenceComponentList] = convert(unit.source);
                const target = translation.getTarget();
                try {
                    const unescapedTaget = backconvert(target, referenceComponentList);
                    // update the target string in the xliff
                    unit.target = unescapedTaget;
                } catch {
                    // @TODO log backconversion error
                }
            }

            // write the localized xliff file
            const localizedPath = this.getLocalizedPath(locale);
            fs.writeFileSync(localizedPath, xliff.serialize(), { encoding: "utf-8" });
        }
    }

    write(): void {
        // no-op, as the localized files are written in the localize method
    }
}

export default PendoXliffFile;
