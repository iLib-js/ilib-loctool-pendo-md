import { SyntaxExtension } from "micromark/dist/shared-types";

export default {
    // disable mechanism based on https://github.com/micromark/micromark-extension-mdx-md/blob/0.1.1/index.js
    disable: {
        null: [
            // disable syntax which is not supported in Pendo markdown
            // i.e. everything from https://github.com/micromark/micromark/blob/2.11.4/lib/constructs.mjs
            // except for
            // - plain text stuff: text, lineEnding, hardBreakEscape, characterEscape, characterReference
            // - bold and italic: attention
            // - labeled links: labelLink and labelEnd
            // - (un)ordered lists: list
            // - HTML inlines (currently needed for {color} parsing in `../../ast-transformer/color`): htmlText
            // as per https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling
            "autolink",
            "blockQuote",
            "codeFenced",
            "codeIndented",
            "codeText",
            "definition",
            "headingAtx",
            // @TODO also disable this after implementing the color syntax extension
            // "htmlFlow",
            // "htmlText",
            "labelStartImage",
            "setextUnderline",
            "thematicBreak",
        ],
    },
} as SyntaxExtension;
