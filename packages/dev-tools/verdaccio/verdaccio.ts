import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export function getVerdaccioStorageDir() {
	const home = homedir();
	let dir;
	if (existsSync(dir = join(home, "AppData/Roaming/verdaccio/storage"))) return dir;
	if (existsSync(dir = join(home, ".local/share/verdaccio/storage"))) return dir;
	if (existsSync(dir = join(home, "./verdaccio/storage/data"))) return dir;
	return undefined;
}

export function getVerdaccioPackageDir(packageName: string) {
	let verdaccioStorageDir = getVerdaccioStorageDir();
	if (!verdaccioStorageDir) return undefined;
	const dir = join(verdaccioStorageDir, packageName);
	if (existsSync(dir)) return dir;
	return undefined;
}
