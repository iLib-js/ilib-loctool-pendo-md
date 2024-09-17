// per https://github.com/iLib-js/xliff/blob/f733c2a65a4215075c8a0b4f0c75aec289de6ae1/src/Xliff.js
declare module "ilib-xliff" {
    export class Xliff {
        deserialize(content: string): void;
        getTranslationUnits(): TranslationUnit[];
    }
}
