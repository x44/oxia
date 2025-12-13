#!/usr/bin/env -S bun

import { argv } from "process";
import { errorArgs } from "../util/error.ts";
import { input } from "../util/term.ts";
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

	const project = new Project("test", projectName);

	project.checkNotExists();

	// Description is optional in test-projects
	project.setDescription(await input("Project description: "), false);

	await project.findFreeServerPort();

	project.write();

	project.createDefaultFilesAndFolders();

	project.runPnpmInstall();
}

main();
