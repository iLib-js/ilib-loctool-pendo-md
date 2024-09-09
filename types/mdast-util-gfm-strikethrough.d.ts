// Barebones definition for mdast-util-gfm-strikethrough v0.2.3 plugin
declare module "mdast-util-gfm-strikethrough" {
    import type { MdastExtension } from "mdast-util-from-markdown";
    import type { Options } from "mdast-util-to-markdown";
    export const fromMarkdown: MdastExtension;
    export const toMarkdown: Options;
}
