/**
 * Replace Pendo markdown extended syntax for color into XML tags,
 * so that micromark parses them into separate mdast nodes that can be further transformed.
 *
 * Pendo markdown color syntax is `{color: #000000}colored text{/color}`.
 * This function replaces all occurrences of opening and closing tags with HTML-like tags
 * `<color value="#000000">colored text</color>`.
 */
export const toXmlTags = (markdown: string) =>
    markdown.replace(/\{color: (#[a-fA-F0-9]{6})\}/g, '<color value="$1">').replace(/\{\/color\}/g, "</color>");

/**
 * Backconverts the XML color tags into Pendo markdown extended color syntax.
 */
export const toMarkdown = (convertedString: string) =>
    convertedString.replace(/<color value="(#[a-fA-F0-9]{6})">/g, "{color: $1}").replace(/<\/color>/g, "{/color}");

export default {
    toXmlTags,
    toMarkdown,
};
