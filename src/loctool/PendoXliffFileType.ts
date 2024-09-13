import { File, FileType, TranslationSet } from "loctool";

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
    readonly type = "pendo-xliff";

    handles(pathName: string): boolean {
        throw new Error("Method not implemented.");
    }
    getExtensions(): string[] {
        throw new Error("Method not implemented.");
    }
    name(): string {
        throw new Error("Method not implemented.");
    }
    write(): void {
        throw new Error("Method not implemented.");
    }
    newFile(path: string): File {
        throw new Error("Method not implemented.");
    }
    getDataType(): string {
        throw new Error("Method not implemented.");
    }
    getDataTypes(): Record<string, string> | undefined {
        throw new Error("Method not implemented.");
    }
    getExtracted(): TranslationSet {
        throw new Error("Method not implemented.");
    }
    addSet(set: TranslationSet): void {
        throw new Error("Method not implemented.");
    }
    getNew(): TranslationSet {
        throw new Error("Method not implemented.");
    }
    getPseudo(): TranslationSet {
        throw new Error("Method not implemented.");
    }
}

export default PendoXliffFileType;
