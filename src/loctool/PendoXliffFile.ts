import type { API, File, Project, TranslationSet } from "loctool";

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

    constructor(path: string, project: Project, loctoolAPI: API) {
        this.path = path;
        this.project = project;
        this.loctoolAPI = loctoolAPI;
    }

    extract(): void {
        throw new Error("Method not implemented.");
    }
    getTranslationSet(): TranslationSet {
        throw new Error("Method not implemented.");
    }
    write(): void {
        throw new Error("Method not implemented.");
    }
    getLocalizedPath(locale: string): string {
        throw new Error("Method not implemented.");
    }
    localize(translations: TranslationSet, locales: string[]): void {
        throw new Error("Method not implemented.");
    }
}

export default PendoXliffFile;
