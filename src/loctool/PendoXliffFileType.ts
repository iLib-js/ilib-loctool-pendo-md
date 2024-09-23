import type { FileType, Project, API, TranslationSet, ResourceString } from "loctool";
import path from "node:path";
import PendoXliffFile, { type TUData } from "./PendoXliffFile";

/**
 * XLIFF file exported from Pendo for translation.
 *
 * This loctool plugin transforms the XLIFF file exported from Pendo
 * into another XLIFF file in which markdown syntax of the source string
 * is escaped using components (`<c0>`). This helps translators avoid
 * breaking the formatting during translation.
 *
 * In addition to escaping the markdown syntax, description of
 * the inserted components is also appended to the Resource comment field
 * of the resulting XLIFF file - this helps translators understand the
 * original formatting of the source string.
 *
 * Backconversion of strings received from translation (with escaped syntax)
 * is done by re-parsing source strings and using the obtained component
 * data as reference.
 */
export class PendoXliffFileType implements FileType {
    constructor(project: Project, loctoolAPI: API) {
        this.project = project;
        this.loctoolAPI = loctoolAPI;
    }

    /**
     * Reference to the loctool {@link Project} instance which uses this file type.
     */
    private readonly project: Project;

    /**
     * Additional functionality provided by loctool to the plugin.
     */
    private readonly loctoolAPI: API;

    private static readonly extensions = [".xliff", ".xlf"];
    getExtensions(): string[] {
        return PendoXliffFileType.extensions;
    }

    /**
     * Check if supplied file path has an extension matching this file type (see {@link extensions}).
     */
    private static hasValidExtension(filePath: string): boolean {
        const extension = path.extname(filePath).toLowerCase();
        return PendoXliffFileType.extensions.includes(extension);
    }

    /** human-readable file type name */
    private static readonly name = "Pendo XLIFF";
    name(): string {
        return PendoXliffFileType.name;
    }

    /**
     * [XLIFF datatype](https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#datatype)
     * identifier for Pendo markdown strings.
     *
     * XLIFFs exported from pendo use <file datatype="pendoguide">,
     * so resources produced by this plugin are custom escaped versions of that datatype.
     */
    public static readonly datatype = "x-pendoguide-escaped";
    getDataType(): string {
        // strings in XLIFFs exported from Pendo are markdown with custom extensions
        return PendoXliffFileType.datatype;
    }

    getDataTypes(): Record<string, string> | undefined {
        // use defaults
        return undefined;
    }

    get sourceLocale() {
        // Per convention (e.g. https://github.com/iLib-js/loctool/blob/285401359f923c1be11e7329b549ed11b4099637/lib/MarkdownFileType.js#L70)
        // it seems that source locale should always come from the project
        return this.project.getSourceLocale();
    }

    handles(pathName: string): boolean {
        // files should have been filtered by extension before calling this method,
        // but following the convention like here: https://github.com/iLib-js/loctool/blob/285401359f923c1be11e7329b549ed11b4099637/lib/MarkdownFileType.js#L61
        // note: this could probably conflict with custom path mappings defined in project config
        // if they define different extensions
        if (!PendoXliffFileType.hasValidExtension(pathName)) {
            return false;
        }

        // @TODO carry over the "already localized" check since it seems to be expected per convention
        // @TODO load path template mappings from the project config

        return true;
    }

    write(): void {
        // no-op
        // per loctool convention, when localized files are written individually
        // there is no need to implement this method
        // (which is meant to write out aggregated resources - whatever that means);
        // this plugin intends to take a source XLIFF file on the input and from it
        // parse resources which have the source string transformed (markdown syntax escaped)
        // while on the output, it should produce one copy of the original XLIFF file
        // for each target locale (with the translated string backconverted from the escaped syntax
        // using the original non-escaped source string as a reference)
    }

    /**
     * Collection of instantiated {@link PendoXliffFile}s by this file type.
     *
     * See {@link getExtracted} on why this is needed.
     */
    private readonly files: Record<string, PendoXliffFile> = {};

    newFile(relativePath: string): PendoXliffFile {
        if (this.files[relativePath]) {
            throw new Error(`Attempt to create a file that already exists: ${relativePath}`);
        }

        const absolutePath = path.join(this.project.getRoot(), relativePath);

        // inject localized path generator, translation set creation and locale mapping
        // into the file instance capturing parameters from the current context where needed
        //
        // (this is done to decouple file processing logic from plugin-related logic
        // (accessing loctool API, project, configuration etc.)

        // register the file instance
        this.files[relativePath] = new PendoXliffFile(
            absolutePath,
            (loctoolLocale) => this.getLocalizedPath(absolutePath, loctoolLocale),
            (loctoolLocale) => this.getOuputLocale(loctoolLocale),
            (units) => this.createTranslationSet(units),
        );

        return this.files[relativePath];
    }

    /**
     * Given a source file path and a locale, returns a path where the localized file should be written
     * (accounting for locale mapping and path template mapping).
     */
    private getLocalizedPath(absolutePath: string, loctoolLocale: string) {
        // apply locale mapping for output path
        const outputLocale = this.getOuputLocale(loctoolLocale);

        const { dir, name, ext: extWithDot } = path.parse(absolutePath);
        // remove optional trailing source locale from filename
        // @TODO use path templates for the locale swap
        let localizedName = name.replace(new RegExp(`_${this.sourceLocale}$`), "");
        // output the localized file in the same directory as the source file
        localizedName = localizedName.length > 0 ? `${localizedName}_${outputLocale}` : outputLocale;
        return path.join(dir, `${localizedName}${extWithDot}`);
    }

    /**
     * Given a target locale (as provided by loctool), return the locale that should be used in the output file.
     */
    private getOuputLocale(loctoolLocale: string): string {
        // @TODO handle locale mapping
        // and add note about the fact that the locale mapping should be handled
        // by loctool rather than each plugin separately
        return loctoolLocale;
    }

    /**
     * Wraps translation units in loctool's ResourceString objects.
     */
    private createTranslationSet(units: TUData[]) {
        // convert to loctool resources
        const resources = units.map((unit) =>
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
        const translationSet = this.loctoolAPI.newTranslationSet<ResourceString>(this.project.getSourceLocale());
        translationSet.addAll(resources);

        return translationSet;
    }

    getExtracted(): TranslationSet {
        // this should ouput a translationset with merged resources from all files
        // which fit this filetype;
        // note: this means that the instance of the filetype class has to keep track of all files it
        // has processed (i.e. each {@link newFile} call should add the file to a list)

        const translationSet = this.loctoolAPI.newTranslationSet(this.sourceLocale);

        for (const path in this.files) {
            const file = this.files[path];
            translationSet.addSet(file.getTranslationSet());
        }

        return translationSet;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- noop, see comment in method
    addSet(set: TranslationSet): void {
        // no-op
        // it's not clear why would the filetype need to add a set of translations to itself
        // given that per the getExtracted method, sets should come from the files
    }

    getNew(): TranslationSet {
        // not sure how this differs from getExtracted
        return this.getExtracted();
    }

    getPseudo(): TranslationSet {
        return this.loctoolAPI.newTranslationSet(this.sourceLocale);
    }

    getResourceTypes() {
        // per https://github.com/iLib-js/loctool/blob/285401359f923c1be11e7329b549ed11b4099637/lib/Project.js#L235-L244:
        // even though not specified in the documeted plugin interface, loctool seems to expect
        // either getResourceTypes() or registerDataTypes() to be present;
        // getResourceTypes() is expected to return a mapping between `datatype` identifier and
        // a class name registered in the ResourceFactory while registerDataTypes();
        // based on existing implementations for built-in file types, it seems that
        // registerDataTypes() does a similar thing but using internal access to the ResourceFactory
        return {
            [this.getDataType()]: "ResourceString",
        } as const;
    }
}

export default PendoXliffFileType;
