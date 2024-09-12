import type { Color } from "./color";
import { fromColorNodes, toColorNodes } from "./color";

// extend available nodes in mdast
// as described in JSDoc of @types/mdast@3.0.15
declare module "mdast" {
    interface PhrasingContentMap {
        Color: Color;
    }
}

export { Color };
export default { fromColorNodes, toColorNodes };
