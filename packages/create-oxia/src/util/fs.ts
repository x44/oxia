import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

export function readTextFile(filePath: string) {
	return readFileSync(filePath, "utf8");
}

export function writeTextFile(filePath: string, data: string) {
	mkdirForFile(filePath);
	writeFileSync(filePath, data, "utf8");
}

export function mkdir(dir: string) {
	if (!existsSync(dir)) {
		mkdirSync(dir, {recursive: true});
	}
}

function mkdirForFile(filePath: string) {
	const dir = dirname(filePath);
	if (!existsSync(dir)) {
		mkdirSync(dir, {recursive: true});
	}
}

/** Returns the absolute, joined and slashified path. */
export function absPath(...paths: string[]) {
	return slashify(resolve(join(...paths)));
}

/** Returns the slashified path. */
export function slashify(path: string) {
	return path.replaceAll("\\", "/");
}
