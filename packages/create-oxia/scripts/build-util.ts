import chalk from "chalk";
import { execSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { createTemplateMetaFromPackageJson, writeTemplateMeta } from "../src/util/meta.js";

export const cwd = slashify(resolve(""));
export const srcDir = slashify(join(cwd, "src"));
export const dstDir = slashify(join(cwd, "dist"));

function errorExit(msg: string) {
	console.error(chalk.red(msg));
	process.exit(1);
}

export function buildClean() {
	if (existsSync(dstDir)) {
		console.log("deleting", dstDir);
		rmSync(dstDir, {recursive: true});
	}
}

export function buildDone() {
	console.log("bundling", dstDir);
	// console.log("cleaning declarations");
	const declarationsToKeep = [
	].map(file => slashify(file));

	walkFiles(dstDir, (file) => {
		if (!file.endsWith(".d.ts")) return;
		if (!declarationsToKeep.includes(file)) {
			// console.log("deleting", file);
			rmSync(file);
		}
	});


	// console.log("copying templates");
	const cwd = slashify(resolve("")); // /xxx/oxia/packages/create-oxia
	const srcTemplatesDir = slashify(resolve(cwd, "../template-projects"));
	const dstTemplatesDir = slashify(join(dstDir, "templates"));
	// console.log("srcTemplatesDir", srcTemplatesDir);
	// console.log("dstTemplatesDir", dstTemplatesDir);

	const templates = getDirs(srcTemplatesDir, "rel");
	// console.log(srcTemplateDirs);
	for (const template of templates) {
		const srcTemplateDir = slashify(join(srcTemplatesDir, template));
		const dstTemplateDir = slashify(join(dstTemplatesDir, template));
		copyTemplate(srcTemplateDir, dstTemplateDir);
		metaTemplate(srcTemplateDir, dstTemplateDir);
	}
}

function copyTemplate(srcDir: string, dstDir: string) {
	// console.log("copying template", srcDir, "=>", dstDir);

	const srcSourceDir = slashify(join(srcDir, "src"));
	const dstSourceDir = slashify(join(dstDir, "src"));
	copyTemplateDir(srcSourceDir, dstSourceDir);

	const srcStaticDir = slashify(join(srcDir, "static"));
	const dstStaticDir = slashify(join(dstDir, "static"));
	copyTemplateDir(srcStaticDir, dstStaticDir);
}

function getDirs(dir: string, mode: "abs" | "rel", filter?: (file: string) => boolean) {
	let files = readdirSync(dir);
	files = files.filter(file => statSync(join(dir, file)).isDirectory());
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

function copyTemplateDir(srcDir: string, dstDir: string) {
	if (!existsSync(srcDir)) return;
	// Also create empty dirs
	if (!existsSync(dstDir)) {
		mkdirSync(dstDir, { recursive: true });
	}
	const subs = readdirSync(srcDir);
	for (const sub of subs) {
		const srcAbs = slashify(join(srcDir, sub));
		const dstAbs = slashify(join(dstDir, sub));
		if (statSync(srcAbs).isDirectory()) {
			copyTemplateDir(srcAbs, dstAbs);
		} else {
			copyFile(srcAbs, dstAbs);
		}
	}
}

function metaTemplate(srcDir: string, dstDir: string) {
	const templateMetaOrError = createTemplateMetaFromPackageJson(srcDir);
	if (typeof templateMetaOrError === "string") {
		errorExit(templateMetaOrError);
		return;
	}
	const templateMeta = templateMetaOrError;
	writeTemplateMeta(dstDir, templateMeta);
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
