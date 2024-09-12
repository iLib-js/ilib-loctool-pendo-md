import mdast from "./mdast";
import syntax from "./syntax";
import type { Underline } from "./mdast";

// extend available nodes in mdast types
// as described in JSDoc of @types/mdast@3.0.15
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/e9a0a9a3fae552bff4df6fbad1a05f3ce45fcc4a/types/mdast/v3/index.d.ts#L73
declare module "mdast" {
    interface StaticPhrasingContentMap {
        underline: Underline;
    }
}

export type { Underline };

export default {
    mdastEstension: mdast,
    syntax: syntax,
};
