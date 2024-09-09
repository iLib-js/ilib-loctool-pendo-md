// Manual type definitions for micromark@~2.11.0
// based on https://github.com/micromark/micromark/tree/2.11.4
//
// Added missing definitions for functions used in mdast-util-gfm-strikethrough@~0.6.5
// (https://github.com/micromark/micromark-extension-gfm-strikethrough/tree/0.6.5)
// which were needed to reimplement it for `++underline++` syntax in TS (see `src/markdown/plugin/underline/syntax.ts`).

declare module "micromark/dist/util/classify-character" {
    export default function classifyCharacter(code: number): 1 | 2 | undefined;
}

declare module "micromark/dist/util/chunked-splice" {
    export default function chunkedSplice<T>(array: T[], start: number, end: number, replace: T[]): void;
}

declare module "micromark/dist/util/resolve-all" {
    import type { Construct, Event, Tokenizer } from "micromark/dist/shared-types";
    export default function resolveAll(constructs: Construct[], events: Event[], context: Tokenizer): Event[];
}
