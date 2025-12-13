import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export function getPnpmCacheDir() {
	const home = homedir();
	let dir;
	if (existsSync(dir = join(home, "AppData/Local/pnpm-cache"))) return dir;
	if (existsSync(dir = join(home, "Library/Caches/pnpm"))) return dir; // macOS
	if (existsSync(dir = join(home, ".cache/pnpm"))) return dir; // Linux
	return undefined;
}

export function getDlxCacheDir() {
	const pnpmCacheDir = getPnpmCacheDir();
	if (!pnpmCacheDir) return undefined;
	const dir = join(pnpmCacheDir, "dlx");
	if (existsSync(dir)) return dir;
	return undefined;
}
