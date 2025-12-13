import { existsSync, mkdirSync, rmSync } from "fs";
import { absPath } from "../src/util/fs.js";

/**
 * This must not be in the test folder. Otherwise we get the strangest error, like
 * Error: "transformResult" in not defined. This is a bug in Vitest.
 *
 * Maybe it would work (inside the test folder) if we excluded the tmp folder in
 * vite.config.ts test.exclude
 *
 * However, now it works (most of the time), and I am sick of testing the test framework...
 *
 * This strange error still happens sometimes.
 */
const TMP = `tmp/test`;
export const TMP_ROOT = absPath(TMP);

export function setup() {
	console.log("cleaning", TMP_ROOT);
	if (existsSync(TMP_ROOT)) rmSync(TMP_ROOT, {recursive: true});
	mkdirSync(TMP_ROOT, {recursive: true});
}
