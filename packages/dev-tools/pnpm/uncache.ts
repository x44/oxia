#!/usr/bin/env -S bun

import chalk from "chalk";
import { spawnSync } from "child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "fs";
import { dirname, join } from "path";
import { argv } from "process";
import { getDlxCacheDir, getPnpmCacheDir } from "./pnpm.ts";

/**
 * Note, that this does not delete the pnpm store file in .../pnpn/store/vX
 * So, we call "pnpm store prune" afterwards to remove the pnpm store file.
 */
function deletePnpmPackage(pnpmCacheDir: string, packageName: string) {
	let didDelete = false;
	const metadataDirs = readdirSync(pnpmCacheDir).filter(d => d.startsWith("metadata")).map(d => join(pnpmCacheDir, d)).filter(d => statSync(d).isDirectory());
	for (const metadataDir of metadataDirs) {
		const registryDirs = readdirSync(metadataDir).map(d => join(metadataDir, d)).filter(d => statSync(d).isDirectory());

		for (const registryDir of registryDirs) {
			const jsonFile = join(registryDir, `${packageName}.json`);
			if (!existsSync(jsonFile)) continue;

			deleteFileOrDir(jsonFile);

			if (packageName.startsWith("@")) {
				// delete the @package dir if it is empty
				const atDir = dirname(jsonFile);
				if (readdirSync(atDir).length === 0) {
					deleteFileOrDir(atDir);
				}
			}

			didDelete = true;
		}
	}
	return didDelete;
}

function deleteDlxPackage(dlxCacheDir: string, packageName: string) {
	const subDirs = readdirSync(dlxCacheDir).map(d => join(dlxCacheDir, d)).filter(d => statSync(d).isDirectory());

	for (const subDir of subDirs) {
		const pkg = join(subDir, "pkg");
		if (!existsSync(pkg)) continue;
		const packageJsonFile = join(pkg, "package.json");
		if (!existsSync(packageJsonFile)) continue;
		const packageJson = JSON.parse(readFileSync(packageJsonFile, "utf8"));
		const dependencies = packageJson["dependencies"];
		if (!(packageName in dependencies)) continue;

		deleteFileOrDir(subDir);
	}
}

function deleteFileOrDir(f: string) {
	if (!existsSync(f)) return;
	rmSync(f, { recursive: true });
}

function runStorePrune() {
	const cmd = "pnpm store prune";
	const proc = spawnSync(cmd, { shell: true });
	if (proc.error) {
		console.error(chalk.red(proc.error));
	}
}

export function uncache(...packageNames: string[]) {
	if (packageNames.length === 0) {
		console.error("pnpm-uncache", chalk.red("missing package name(s)"));
		process.exit(1);
	}

	const pnpmCacheDir = getPnpmCacheDir();
	if (!pnpmCacheDir) {
		console.warn("pnpm-uncache", chalk.red("failed to get pnpm cache dir"));
	}

	const dlxCacheDir = getDlxCacheDir();
	if (!dlxCacheDir) {
		console.warn("pnpm-uncache", chalk.red("failed to get dlx cache dir"));
	}

	let didDeletePnpmPackage = false;

	for (const packageName of packageNames) {
		console.log("pnpm-uncache", chalk.blue(packageName));

		if (pnpmCacheDir) {
			if (deletePnpmPackage(pnpmCacheDir, packageName)) {
				didDeletePnpmPackage = true;
			}
		}

		if (dlxCacheDir) {
			if (packageName.startsWith("create-")) {
				deleteDlxPackage(dlxCacheDir, packageName);
			}
		}
	}

	// Run pnpm store prune to remove the store file(s) of the deleted pnpm packages.
	// Not required if we only deleted dlx packages, since they are not in the store.
	if (didDeletePnpmPackage)  {
		runStorePrune();
	}
}

if (import.meta.main) {
	const packageNames = argv.slice(2);
	uncache(...packageNames);
}
