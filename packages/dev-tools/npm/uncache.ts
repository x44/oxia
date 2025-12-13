#!/usr/bin/env -S bun

import chalk from "chalk";
import { existsSync, readdirSync, rmSync } from "fs";
import { join } from "path";
import { argv } from "process";
import { getNpmCacheDir, getNpxCacheDir } from "./npm.ts";

/**
 * Note, that this function only deletes the package files and folders,
 * but does not update package.json/package-lock.json.
 * However, this is enough to trigger a refetch.
 */
function deleteNpxPackage(npxCacheDir: string, packageName: string) {
	const subDirs = readdirSync(npxCacheDir).map(d => join(npxCacheDir, d));
	for (const subDir of subDirs) {
		const nodeModulesDir = join(subDir, "node_modules");
		const nodeModulesBinDir = join(nodeModulesDir, ".bin");
		const packageDir = join(nodeModulesDir, packageName);
		const packageBinFiles = existsSync(nodeModulesBinDir) ? readdirSync(nodeModulesBinDir).filter(d => d === packageName || d.startsWith(packageName + ".")).map(d => join(nodeModulesBinDir, d)): [];
		deleteFileOrDir(packageDir);
		for (const packageBinFile of packageBinFiles) {
			deleteFileOrDir(packageBinFile);
		}
	}
}

function deleteFileOrDir(f: string) {
	if (!existsSync(f)) return;
	rmSync(f, { recursive: true });
}

export function uncache(...packageNames: string[]) {
	if (packageNames.length === 0) {
		console.error("npm-uncache", chalk.red("missing package name(s)"));
		process.exit(1);
	}

	const npmCacheDir = getNpmCacheDir();
	if (!npmCacheDir) {
		console.warn("npm-uncache", chalk.red("failed to get npm cache dir"));
	}

	const npxCacheDir = getNpxCacheDir();
	if (!npxCacheDir) {
		console.warn("npm-uncache", chalk.red("failed to get npx cache dir"));
	}

	for (const packageName of packageNames) {
		console.log("npm-uncache", chalk.blue(packageName));

		if (npxCacheDir) {
			if (packageName.startsWith("create-")) {
				deleteNpxPackage(npxCacheDir, packageName);
			}
		}
	}
}

if (import.meta.main) {
	const packageNames = argv.slice(2);
	uncache(...packageNames);
}
