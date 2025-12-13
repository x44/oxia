import chalk from "chalk";
import { spawnSync } from "child_process";
import { join } from "path";

export function getNpmCacheDir() {
	const cmd = "npm get cache";
	const proc = spawnSync(cmd, { shell: true });
	if (proc.error) {
		console.error(chalk.red(proc.error));
		return undefined;
	}
	return proc.stdout.toString("utf8").trim();
}

export function getNpxCacheDir() {
	const npmCacheDir = getNpmCacheDir();
	if (!npmCacheDir) return undefined;
	return join(npmCacheDir, "_npx");
}
