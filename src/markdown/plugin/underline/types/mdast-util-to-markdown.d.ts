// Manual type definitions for mdast-util-to-markdown@0.6.5
// (https://github.com/syntax-tree/mdast-util-to-markdown/tree/0.6.5)
//
// Added missing definitions for functions used in mdast-util-gfm-strikethrough@0.2.3
// (https://github.com/syntax-tree/mdast-util-gfm-strikethrough/tree/0.2.3)
// which were needed to reimplement it for `++underline++` syntax in TS (see `..e/mdast.ts`).

declare module "mdast-util-to-markdown/lib/util/container-phrasing" {
    import type { Node } from "unist";
    import type { Context } from "mdast-util-to-markdown";
    export default function phrasing(
        parent: Node,
        context: Context,
        safeOptions: { before: string; after: string },
    ): string;
}
