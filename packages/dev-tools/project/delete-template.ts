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

	const project = new Project("template", projectName);

	project.checkExists();

	if (! await confirmYes()) return;

	project.delete();
}

main();
