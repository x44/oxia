import { existsSync } from "fs";
import { dirname, join } from "path";
import { argv } from "process";

export function findParentDir(wantedDir: string) {
	let dir = dirname(argv[1]);
	let sanity = 0;
	while (true) {
		const theDir = join(dir, wantedDir);
		if (existsSync(theDir)) {
			return theDir;
		}
		const old = dir;
		dir = dirname(dir);
		if (old === dir || ++sanity > 10) {
			return undefined;
		}
	}
}
