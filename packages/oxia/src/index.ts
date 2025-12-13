import * as fs from "fs";
import * as path from "path";
import { argv } from "process";
import { MainLoader } from "./loader/MainLoader.js";

const d = path.dirname(argv[1]);
const dir = fs.existsSync(path.join(d, "dist")) ? path.join(d, "dist") : d;

const index = "file:///" + path.join(dir, "cli", "index.ts");

const loader = new MainLoader();

loader.addImportMapping("oxia", `${path.join(dir, "config", "config.ts")}`);
loader.register();

await import(index);
