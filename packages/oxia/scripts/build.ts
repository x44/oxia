import { buildClean, buildDone, dstDir, exec } from "./build-util.ts";

// *** CLEAN ***
buildClean();

// *** BUILD ***
console.log("building", dstDir);
exec("pnpm exec tsgo -p tsconfig.build.json");

// *** DONE ***
buildDone();
