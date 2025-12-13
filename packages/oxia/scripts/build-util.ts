import { execSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";

export const cwd = slashify(resolve(""));
export const srcDir = slashify(join(cwd, "src"));
export const dstDir = slashify(join(cwd, "dist"));

export function buildClean() {
	if (existsSync(dstDir)) {
		console.log("deleting", dstDir);
		rmSync(dstDir, { recursive: true });
	}
}

export function buildDone() {
	console.log("bundling", dstDir);

	// Copy .d.ts, .js, .oxia
	walkFiles(srcDir, (srcFile) => {
		if (srcFile.endsWith(".d.ts") || srcFile.endsWith(".js") || srcFile.endsWith(".oxia")) {
			const relFile = relative(srcDir, srcFile);
			const dstFile = slashify(join(dstDir, relFile));
			// console.log("copying", srcFile, "=>", dstFile);
			copyFile(srcFile, dstFile);
		}
	});
}

function getFiles(dir: string, mode: "abs" | "rel", filter?: (file: string) => boolean) {
	let files = readdirSync(dir);
	files = files.filter(file => statSync(join(dir, file)).isFile());
	if (mode === "abs") files = files.map(file => join(dir, file));
	if (filter) files = files.filter(file => filter(file));
	files = files.map(file => slashify(file));
	return files;
}

function copyFile(srcFile: string, dstFile: string) {
	const dstDir = dirname(dstFile);
	if (!existsSync(dstDir)) {
		mkdirSync(dstDir, { recursive: true });
	}
	copyFileSync(srcFile, dstFile);
}

function copyDir(dir: string, filter?: (file: string) => boolean) {
	const srcFiles = getFiles(dir, "abs", filter);
	for (const srcFile of srcFiles) {
		const relFile = relative(srcDir, srcFile);
		const dstFile = slashify(join(dstDir, relFile));
		console.log("copying", srcFile, "=>", dstFile);
		copyFile(srcFile, dstFile);
	}
}

function walkFiles(dir: string, callback: (file: string) => void) {
	const subs = readdirSync(dir);
	for (const sub of subs) {
		const abs = slashify(join(dir, sub));
		if (statSync(abs).isDirectory()) {
			walkFiles(abs, callback);
		} else {
			callback(abs);
		}
	}
}

export function touchFile(path: string) {
	const dir = dirname(path);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(path, "", "utf8");
}

export function slashify(path: string) {
	return path.replaceAll("\\", "/");
}

export function exec(...cmds: string[]) {
	try {
		execSync(cmds.join(" "), { stdio: "inherit" });
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}
