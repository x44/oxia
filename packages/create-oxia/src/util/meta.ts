import { existsSync } from "fs";
import { basename } from "path";
import { absPath, readTextFile, writeTextFile } from "./fs.js";

const TEMPLATE_META_FILE = "meta.json";

export type TemplateMeta = {
	id: string;
	name: string;
	description: string;
}

export function readTemplateMeta(templateDir: string) {
	const f = absPath(templateDir, TEMPLATE_META_FILE);
	return JSON.parse(readTextFile(f)) as TemplateMeta;
}

export function writeTemplateMeta(templateDir: string, templateMeta: TemplateMeta) {
	const f = absPath(templateDir, TEMPLATE_META_FILE);
	writeTextFile(f, JSON.stringify(templateMeta, null, "  "));
}

export function createTemplateMetaFromPackageJson(templateDir: string) {
	const packageJsonFile = absPath(templateDir, "package.json");
	if (!existsSync(packageJsonFile)) return `file not found ${packageJsonFile}`;
	const packageJson = JSON.parse(readTextFile(packageJsonFile));

	const id = basename(templateDir);
	const name = id.substring(0, 1).toUpperCase() + id.substring(1);
	const description = packageJson["description"];
	if (!description) return `no 'description' in ${packageJsonFile}`;

	const templateMeta: TemplateMeta = {
		id,
		name,
		description,
	};
	return templateMeta;
}
