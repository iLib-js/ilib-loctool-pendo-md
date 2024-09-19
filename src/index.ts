import type { Plugin } from "loctool";
import PendoXliffFileType from "./loctool/PendoXliffFileType";

// loctool plugin entrypoint
const plugin: Plugin = PendoXliffFileType;

export = plugin;
