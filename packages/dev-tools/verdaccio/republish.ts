#!/usr/bin/env -S bun

import chalk from "chalk";
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { uncache as npmUncache } from "../npm/uncache.ts";
import { uncache as pnpmUncache } from "../pnpm/uncache.ts";
import { unpublish } from "./unpublish.ts";

export function republish() {
	const cwd = resolve("");

	const packageJson = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
	const packageName = packageJson["name"];
	const packageVersion = packageJson["version"];

	unpublish(packageName);

	console.log("verdaccio-republish", chalk.blue(`${packageName}/${packageVersion}`), cwd);

	const cmd = "npm --registry http://localhost:4873 publish --tag latest";
	const proc = spawnSync(cmd, { shell: true, cwd: cwd });
	if (proc.error) {
		console.error(chalk.red(proc.error));
		process.exit(1);
	}

	console.log(proc.stdout.toString("utf8"));
	console.log(proc.stderr.toString("utf8"));

	npmUncache(packageName);
	pnpmUncache(packageName);
}

if (import.meta.main) {
	republish();
}