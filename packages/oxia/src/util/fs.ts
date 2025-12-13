import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

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

export function delDir(dir: string) {
	if (existsSync(dir)) {
		rmSync(dir, {recursive: true});
	}
}

export function delFile(filePath: string) {
	if (existsSync(filePath)) {
		rmSync(filePath);
	}
}

export function copyFile(srcFile: string, dstFile: string) {
	mkdirForFile(dstFile);
	copyFileSync(srcFile, dstFile);
}

/** Recursively copies the content of srcDir into dstDir. */
export function copyDir(srcDir: string, dstDir: string) {
	if (!existsSync(dstDir)) {
		mkdirSync(dstDir, {recursive: true});
	}
	const subs = readdirSync(srcDir);
	for (const sub of subs) {
		const srcAbs = joinedPath(srcDir, sub);
		const dstAbs = joinedPath(dstDir, sub);
		if (statSync(srcAbs).isDirectory()) {
			copyDir(srcAbs, dstAbs);
		} else {
			copyFile(srcAbs, dstAbs);
		}
	}
}

/** Recursively walks the content of srcDir and invokes the callback with the absolute src and dst file. */
export function walkSrcAndDstDir(srcDir: string, dstDir: string, callback: (srcFile: string, dstFile: string) => void) {
	const subs = readdirSync(srcDir);
	for (const sub of subs) {
		const srcAbs = joinedPath(srcDir, sub);
		const dstAbs = joinedPath(dstDir, sub);
		if (statSync(srcAbs).isDirectory()) {
			walkSrcAndDstDir(srcAbs, dstAbs, callback);
		} else {
			callback(srcAbs, dstAbs);
		}
	}
}

/** Returns the absolute and slashified path. */
export function absolute(path: string) {
	return slashify(resolve(path));
}

/** Returns the absolute, joined and slashified path. */
export function absPath(...paths: string[]) {
	return slashify(resolve(join(...paths)));
}

/** Returns the relative, slashified path. */
export function relPath(from: string, to: string) {
	return slashify(relative(from, to));
}

/** Returns the joined and slashified path. */
export function joinedPath(...paths: string[]) {
	return slashify(join(...paths));
}

/** Returns the slashified path. */
export function slashify(path: string) {
	return path.replaceAll("\\", "/");
}

/**
 * Returns whether childPath is equal to or inside parentPath.
 * Both paths must be absolute.
*/
export function isPathEqualOrInside(parentPath: string, childPath: string) {
	return childPath === parentPath || childPath.startsWith(parentPath);
}

export function changeExtension(filePath: string, ext: string) {
	return filePath.substring(0, filePath.lastIndexOf(".")) + ext;
}