import type { API, File, Project, ResourceString, TranslationSet } from "loctool";
import { type TranslationUnit, Xliff } from "ilib-xliff";
import path from "node:path";
import fs from "node:fs";
import { convert } from "../markdown/convert/convert";

export class PendoXliffFile implements File {
    /**
     * Path to the file being localized (i.e. source file).
     */
    private readonly path: string;

    /**
     * Reference to the loctool {@link Project} instance which uses this file type.
     */
    private readonly project: Project;

    /**
     * Additional functionality provided by loctool to the plugin.
     */
    private readonly loctoolAPI: API;

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

    constructor(path: string, project: Project, loctoolAPI: API) {
        this.path = path;
        this.project = project;
        this.loctoolAPI = loctoolAPI;
    }

    /**
     * Per convention it seems that source locale should always come from the project
     */
    get sourceLocale() {
        return this.project.getSourceLocale();
    }

    getLocalizedPath(locale: string): string {
        // it looks like Loctool does not use this method currently
        // as of https://github.com/iLib-js/loctool/commit/285401359f923c1be11e7329b549ed11b4099637
        // since it seems to expect the plugin to write all localized files on its own
        // during {@link localize} method call
        const dirname = path.dirname(this.path);
        const extname = path.extname(this.path);

        // remove optional trailing source locale from filename
        const name = path.basename(this.path).replace(`_${this.sourceLocale}$`, "");

        // output the localized file in the same directory as the source file
        const nameWithLocale = name.length > 0 ? `${name}_${locale}` : locale;

        return path.join(dirname, `${nameWithLocale}.${extname}`);
    }

    extract(): void {
        // load the source XLIFF file into memory
        const content = fs.readFileSync(this.path, "utf-8");
        this.xliff = new Xliff();
        this.xliff.deserialize(content);
    }

    /**
     * Escape markdown syntax in source strings of the supplied TUs
     * and insert escaped component descriptions into their comments.
     */
    private static toEscaped(translationUnits: TranslationUnit[]) {
        return translationUnits.map((unit) => {
            // escape the source string
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

    getTranslationSet() {
        const translationUnits = this.xliff
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- implementation pending
    localize(translations: TranslationSet, locales: string[]): void {
        throw new Error("Method not implemented.");
    }

    write(): void {
        throw new Error("Method not implemented.");
    }
}

export default PendoXliffFile;
