// eslint-disable-next-line @typescript-eslint/no-unused-vars -- import used in JSDoc link
import type astTransformerColor from "../../ast-transformer/color";
/**
 * Used to match post-conversion color opening and closing nodes
 * ```markdown
 * <color value="#000000">colored text</color>
 * ```
 */
export const htmlRegex = {
    opening: /<color value="(?<value>#[a-fA-F0-9]{6})">/,
    closing: /<\/color>/,
} as const;

/**
 * Used to match Pendo extended markdown color opening and closing nodes for conversion
 * ```markdown
 * {color: #000000}colored text{/color}
 * ```
 */
export const tagRegex = {
    opening: /\{color: (?<value>#[a-fA-F0-9]{6})\}/,
    closing: /\{\/color\}/,
} as const;

const globalRegex = (regex: RegExp) => new RegExp(regex, "g");

/**
 * Replace Pendo extended markdown syntax for color spans into HTML tags,
 * so that micromark would parse them as inline HTML nodes (rather than just plain text).
 *
 * This allows for further transformation of the AST to obtain custom Color nodes
 * \- see {@link astTransformerColor.toColorNodes}.
 *
 * Pendo extended markdown color syntax is
 * ```markdown
 * {color: #000000}colored text{/color}
 * ```
 * This function replaces all occurrences of opening and closing tags with HTML-like tags
 * ```markdown
 * <color value="#000000">colored text</color>
 * ```
 */
export const toHtmlTags = (markdown: string) =>
    markdown
        .replaceAll(globalRegex(tagRegex.opening), '<color value="$<value>">')
        .replaceAll(globalRegex(tagRegex.closing), "</color>");

/**
 * Backconverts the XML color tags into Pendo markdown extended color syntax
 *
 * @see {@link toHtmlTags}
 */
export const fromHtmlTags = (convertedString: string) =>
    convertedString
        .replaceAll(globalRegex(htmlRegex.opening), "{color: $<value>}")
        .replace(globalRegex(htmlRegex.closing), "{/color}");
