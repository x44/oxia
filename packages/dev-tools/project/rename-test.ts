#!/usr/bin/env -S bun

import { argv } from "process";
import { errorArgs } from "../util/error.ts";
import { Project } from "./impl/project.ts";

const ARGS = ["<old-project-name>", "<new-project-name>"];

function parseArgs() {
	return [
		argv[2],
		argv[3],
	];
}

async function main() {
	const [oldProjectName, newProjectName] = parseArgs();
	if (!oldProjectName) errorArgs(ARGS, "missing old-project-name");
	if (!newProjectName) errorArgs(ARGS, "missing new-project-name");

	const oldProject = new Project("test", oldProjectName);
	const newProject = new Project("test", newProjectName);

	oldProject.checkExists();
	newProject.checkNotExists();

	oldProject.renameTo(newProject);
}

main();
