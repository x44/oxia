#!/usr/bin/env -S bun

import { argv } from "process";
import { errorArgs } from "../util/error.ts";
import { confirmYes } from "../util/term.ts";
import { Project } from "./impl/project.ts";

const ARGS = ["<project-name>"];

function parseArgs() {
	return [
		argv[2],
	];
}

async function main() {
	const [projectName] = parseArgs();
	if (!projectName) errorArgs(ARGS, "missing project-name");

	const srcProject = new Project("test", projectName);
	const dstProject = new Project("template", projectName);

	srcProject.checkExists();
	dstProject.checkNotExists();

	if (! await confirmYes()) return;

	// Description is mandatory in template-projects
	dstProject.setDescription(srcProject.checkDescription(), true);

	await dstProject.findFreeServerPort();

	dstProject.write();

	dstProject.copyFilesFrom(srcProject);

	dstProject.runPnpmInstall();
}

main();
