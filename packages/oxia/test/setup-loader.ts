import { OxiaLoader } from "../src/loader/OxiaLoader.js";
import { MemFs } from "../src/memfs/MemFs.js";

// console.log(blue("Setup"), green("registering loader"));
const fs = new MemFs();
const loader = new OxiaLoader(fs);
loader.register();
