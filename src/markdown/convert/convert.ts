import baseFromMarkdown from "mdast-util-from-markdown";
import baseToMarkdown from "mdast-util-to-markdown";
import strikethrough from "mdast-util-gfm-strikethrough";
import strikethroughSyntax from "micromark-extension-gfm-strikethrough";
import unistUtilRemovePosition from "unist-util-remove-position";
import underline from "../micromark-plugin/underline";
import colorString from "../string-transformer/color";
import colorAst from "../ast-transformer/color";
import component from "../ast-transformer/component";
import unsupported from "../micromark-plugin/unsupported";

import type { Root } from "mdast";
import type { ComponentList } from "../ast-transformer/component";

const fromMarkdown = (markdown: string) =>
    baseFromMarkdown(markdown, {
        extensions: [unsupported.syntax, strikethroughSyntax({ singleTilde: false }), underline.syntax()],
        mdastExtensions: [strikethrough.fromMarkdown, underline.mdastEstension.fromMarkdown],
    });

const toMarkdown = (ast: Root) =>
    baseToMarkdown(ast, {
        // note (intentional): in `toMarkdown`, mdast extensions should be passed to opt `extensions`
        extensions: [strikethrough.toMarkdown, underline.mdastEstension.toMarkdown],
    });

/**
 * Take a Pendo markdown string and escape syntax using components.
 *
 * Given a Pendo markdown string like this
 * ``` markdown
 * string with *emphasis*, ++underline++, {color: #FF0000}colored text{/color} and [a link](https://example.com)
 * ```
 * transform it to escape markdown syntax (as specified by
 * [Pendo documentation](https://support.pendo.io/hc/en-us/articles/360031866552-Use-markdown-syntax-for-guide-text-styling)
 * \- including their extensions) using numbered components
 * ```text
 * string with <c0>emphasis</c0>, <c1>underline</c1>, <c2>color</c2> and <c3>a link</c3>
 * ```
 * additionally, output data about those components
 * ```text
 * - c0: emphasis
 * - c1: underline
 * - c2: color #FF0000
 * - c3: link https://example.com
 * ```
 * to use it later for backconversion.
 *
 * @returns Tuple of escaped string and the list of components
 */
export const convert = (markdown: string): readonly [string, ComponentList] => {
    // step 1:
    // pre-transform Pendo markdown string
    // to convert their custom Color tags {color: #000000}{/color}
    // into HTML tags <color value="#000000"></color>
    // which are easier to process through AST transformations
    // @TODO this and related steps should be removed after implementing proper micromark extension for parsing color tags
    const markdownWithColorAsHtml = colorString.toHtmlTags(markdown);

    // step 2:
    // parse the pre-transformed markdown into mdast;
    // use parser plugins to support syntax extensions
    // for GFM strikethrough (~~ ~~) and Pendo underline (++ ++)
    // and disable syntax which is NOT supported by Pendo (headings, blockquotes, code, autolinks etc.)
    const ast = fromMarkdown(markdownWithColorAsHtml);

    // remove position data from the AST since we don't need it for further processing
    // and also it does not reflect the original markdown string anyway
    const astNoPosition = unistUtilRemovePosition(ast) as Root;

    // step 3:
    // transform the given mdast tree to find HTML nodes corresponding to <color ...> tags
    // and replace them with custom Color ast nodes
    const astWithColorNodes = colorAst.toColorNodes(astNoPosition);

    // step 4:
    // transform the AST to replace supported markdown syntax using numbered components;
    // also collect data about those components
    const [astWithComponents, components] = component.toComponents(astWithColorNodes);

    // step 5:
    // reassemble the escaped string from the AST with components
    const escapedString = toMarkdown(astWithComponents as Root);

    // step 6:
    // trim the produced string to remove the trailing newline
    // (`toMarkdown` always inerts a newline at the end of a paragraph)
    const trimmedEscapedString = escapedString.trimEnd();

    return [trimmedEscapedString, components] as const;
};

/**
 * Take an escaped string and a list of components and backconvert it to Pendo markdown syntax.
 *
 * Given an escaped string with numbered components like this
 * ```text
 * string with <c0>emphasis</c0>, <c1>underline</c1>, <c2>colored text</c2> and <c3>a link</c3>
 * ```
 * and a list of components like this
 * ```text
 * - c0: emphasis
 * - c1: underline
 * - c2: color #FF0000
 * - c3: link https://example.com
 * ```
 * transform it back to Pendo markdown syntax
 * ``` markdown
 * string with *emphasis*, ++underline++, {color: #FF0000}colored text{/color} and [a link](https://example.com)
 * ```
 *
 * This is reverse operation to {@link convert} and should produce the original markdown string.
 */
export const backconvert = (escapedString: string, components: ComponentList): string => {
    // step 1:
    // parse the escaped string into mdast;
    // use the same parser plugins as in `convert` to ensure compatibility
    // (most importantly, the unsupported syntax should match)
    const ast = fromMarkdown(escapedString);

    // step 2:
    // replace numbered components with original mdast nodes
    // (this includes custom Color nodes)
    const astNoComponents = component.fromComponents(ast, components) as Root;

    // step 3:
    // replace custom Color nodes with HTML <color ...> tags
    const astNoColorNodes = colorAst.fromColorNodes(astNoComponents);

    // step 4:
    // reassemble the backconverted string
    const markdownWithColorAsHtml = toMarkdown(astNoColorNodes);

    // step 5:
    // revert color tags <color value="#000000"></color>
    // back to Pendo markdown syntax {color: #000000}{/color}
    const markdown = colorString.fromHtmlTags(markdownWithColorAsHtml);

    // step 6:
    // trim the produced string to remove the trailing newline
    // (`toMarkdown` always inerts a newline at the end of a paragraph)
    const trimmedMarkdown = markdown.trimEnd();

    return trimmedMarkdown;
};
