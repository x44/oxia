#!/usr/bin/env -S bun

import chalk from "chalk";
import { spawnSync } from "child_process";
import chokidar from "chokidar";
import { error, info } from "console";
import type { Stats } from "fs";
import { dirname } from "path";
import { argv } from "process";
import { resolveOptions } from "../../oxia/src/build/options/options.ts";
import type { Options } from "../../oxia/src/config/types.ts";
import { formatMiddleware } from "../../oxia/src/server/middleware.ts";
import { reloadDevServer, setDevServerClientReloadScriptDir, startDevServer } from "../../oxia/src/server/server.ts";
import { absPath } from "../../oxia/src/util/fs.ts";
import { errorArgs } from "../util/error.ts";

let ASTRO_PROJECT_ROOT = ""
let ASTRO_PROJECT_SRC = "";
let ASTRO_PROJECT_DIST = "";

let PORT = 7000;

const ARGS = ["<astro-project-dir>", "[-port n]"];

function parseArgs() {
	for (let i = 2; i < argv.length; ++i) {
		if (!argv[i].startsWith("-")) {
			ASTRO_PROJECT_ROOT = argv[i];
		} else
		if (argv[i] === "-port") {
			PORT = parseInt(argv[++i]);
		}
	}

	if (ASTRO_PROJECT_ROOT === "") {
		errorArgs(ARGS, "missing astro-project-dir");
	}

	ASTRO_PROJECT_SRC = `${ASTRO_PROJECT_ROOT}/src`;
	ASTRO_PROJECT_DIST = `${ASTRO_PROJECT_ROOT}/dist`;
}

function createOptions() {
	const options: Options = {
		main: {},
		build: {},
		paths: {},
		server: {},
	};

	const resolvedOptions = resolveOptions("dev", options);

	resolvedOptions.server = {
		port: PORT,
		host: "127.0.0.1",
		routes: ASTRO_PROJECT_DIST,
		static: ASTRO_PROJECT_DIST,
		open: false,
		route: "/",
		code: true,
	};
	return resolvedOptions;
}

function runAstroBuild() {
	console.log(chalk.yellow("building astro project..."));
	const res = spawnSync("npm run build", [], { shell: true, encoding: "utf8", cwd: ASTRO_PROJECT_ROOT });

	if (res.status !== 0) {
		error(res.stderr);
	} else {
		console.log(res.stdout.trim());
	}
}

async function startServer() {
	const scriptDir = dirname(argv[1]);
	setDevServerClientReloadScriptDir(absPath(scriptDir, "../../oxia/src/server"));

	const options = createOptions();
	await startDevServer(options, formatMiddleware);
}

function startWatching() {
	const dirs = [
		ASTRO_PROJECT_SRC
	];
	const watcher = chokidar.watch(dirs);
	watcher.on("ready", () => {
		info("watching", dirs.length === 1 ? dirs[0] : dirs);
		watcher.on("add", onWatcher);
		watcher.on("change", onWatcher);
		watcher.on("unlink", onWatcher);
	});

	const changedFiles = new Set<string>();

	async function onWatcher(path: string, stats?: Stats) {
		changedFiles.add(path);
		await runDeferred(path);
	}

	// We debounce 50 ms. Maybe we can find a better timing.
	// When renaming a folder, for example, this may be too low.
	// However 250 ms seemed to be ok, but then the reactivity
	// is not se jello from se eg!
	const changeRequests = new Set<string>();
	let timeout: NodeJS.Timeout | undefined = undefined;
	async function runDeferred(path: string) {
		if (changeRequests.has(path)) return;

		changeRequests.add(path);

		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(async () => {
			const changedPaths = [...changeRequests];
			changeRequests.clear();
			await onSourceFilesChanged(changedPaths);
		}, 50);
	}
}

async function onSourceFilesChanged(changedPaths: string[]) {
	runAstroBuild();
	reloadDevServer();
}

parseArgs();
runAstroBuild();
await startServer();
startWatching();
