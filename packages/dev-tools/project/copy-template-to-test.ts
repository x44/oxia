#!/usr/bin/env -S bun

import { argv } from "process";
import { errorArgs } from "../util/error.ts";
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

	const srcProject = new Project("template", projectName);
	const dstProject = new Project("test", projectName);

	srcProject.checkExists();
	dstProject.checkNotExists();

	// Description is optional in test-projects
	dstProject.setDescription(srcProject.checkDescription(), false);

	await dstProject.findFreeServerPort();

	dstProject.write();

	dstProject.copyFilesFrom(srcProject);

	dstProject.runPnpmInstall();
}

main();
