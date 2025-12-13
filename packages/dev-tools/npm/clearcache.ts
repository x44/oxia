#!/usr/bin/env -S bun

import chalk from "chalk";
import { existsSync, mkdirSync, rmSync } from "fs";
import { getNpxCacheDir } from "./npm.ts";

export function clearcache() {
	const npxCacheDir = getNpxCacheDir();
	if (!npxCacheDir) {
		console.error("npx-clearcache", chalk.red("failed to get npx cache dir"));
		process.exit(1);
	}

	console.log("npx-clearcache", chalk.blue(npxCacheDir));
	rmSync(npxCacheDir, { recursive: true });
	if (!existsSync(npxCacheDir)) {
		mkdirSync(npxCacheDir, { recursive: true });
	}
}

if (import.meta.main) {
	clearcache();
}