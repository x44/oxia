#!/usr/bin/env -S bun

import chalk from "chalk";
import { rmSync } from "fs";
import { argv } from "process";
import { getVerdaccioPackageDir } from "./verdaccio.ts";

function deleteVerdaccioPackage(packageName: string) {
	const dir = getVerdaccioPackageDir(packageName);
	if (!dir) return;
	rmSync(dir, { recursive: true });
}

export function unpublish(...packageNames: string[]) {
	if (packageNames.length === 0) {
		console.error("verdaccio-unpublish", chalk.red("missing package name(s)"));
		process.exit(1);
	}
	for (const packageName of packageNames) {
		console.log("verdaccio-unpublish", chalk.blue(packageName));
		deleteVerdaccioPackage(packageName);
	}
}

if (import.meta.main) {
	const packageNames = argv.slice(2);
	unpublish(...packageNames);
}
