import chalk from "chalk";
import chokidar from "chokidar";
import { existsSync, readdirSync, readFileSync, realpathSync, Stats } from "node:fs";
import { basename, dirname, join } from "node:path";
import { clearTimeout, setTimeout } from "node:timers";
import type { MainCommand, ResolvedOptions } from "../config/types.js";
import { OxiaLoader } from "../loader/OxiaLoader.js";
import { MemFs } from "../memfs/MemFs.js";
import { reloadDevServer, startDevServer } from "../server/server.js";
import { absPath, copyDir, delDir, relPath, slashify, writeTextFile } from "../util/fs.js";
import { Log } from "../util/log.js";
import { Timings } from "../util/timings.js";
import { initArgs } from "./args.js";
import { DependencyRegistry } from "./dependencies/dependency-registry.js";
import { createRouteFile, type RouteFileBuildResult } from "./file/file.js";
import { tsx2html, writeErrorHtml } from "./tsx2html/index.js";

type ChangeType = "sources" | "static" | "all";

function cleanDst(options: ResolvedOptions) {
	Log.debug("cleaning", options.paths.distStatic);
	delDir(options.paths.distStatic);

	if (options.paths.distRoutes !== options.paths.distStatic) {
		Log.debug("cleaning", options.paths.distRoutes);
		delDir(options.paths.distRoutes);
	}
}

function collectRouteFiles(options: ResolvedOptions) {
	const routesDir = options.paths.routes;
	const sourceDir = options.paths.source;

	Log.debug("collecting route files from", routesDir);
	if (!existsSync(routesDir)) {
		// No source files yet
		Log.debug("no route files in", routesDir);
		return [];
	}

	let routeFiles = readdirSync(routesDir).filter(file => file.endsWith(".oxia")).map(file => absPath(routesDir, file));
	Log.debug("found", routeFiles.length, "route file(s)", routeFiles.map(f => relPath(sourceDir, f)));

	routeFiles = routeFiles.filter(file => {
		const included = !basename(file).startsWith("_");
		if (!included) {
			Log.debug("excluded", file);
		}
		return included;
	});

	// Log.debug(routeFiles);
	return routeFiles.map(routeFile => createRouteFile(options, routeFile));
}

/** Builds to dist */
async function build(options: ResolvedOptions, changedFiles: string[] | "all") {
	const routeFiles = collectRouteFiles(options);
	if (routeFiles.length === 0) {
		Log.warn("no route files in", options.paths.routes);
		return [];
	}

	for await (const routeFile of routeFiles) {
		DependencyRegistry.addRoute(routeFile.oxiaAbsPath);
	}

	// INVALIDATE CHANGED FILES
	if (changedFiles === "all") {
		DependencyRegistry.invalidateAllFiles();
		OxiaLoader.invalidateAllFiles(options.paths.source, new Date().getTime());
	} else {
		DependencyRegistry.invalidateFiles(changedFiles);
		OxiaLoader.invalidateFiles(options.paths.source, new Date().getTime(), changedFiles);
	}

	const routeFileBuildResults: RouteFileBuildResult[] = [];

	for await (const routeFile of routeFiles) {

		if (!DependencyRegistry.routeNeedsValidation(routeFile.oxiaAbsPath)) {
			continue;
		}

		Timings.begin(`Building ${routeFile.oxiaRelPath}`);

		DependencyRegistry.validateRoute(routeFile.oxiaAbsPath);

		const routeFileBuildResult: RouteFileBuildResult = {
			routeFile
		};

		try {
			const html = await tsx2html(options, routeFile);
			writeTextFile(routeFile.htmlAbsPath, html);
		} catch (error) {
			routeFileBuildResult.error = error as Error;
			writeErrorHtml(routeFile, (error as Error).stack!.toString());
		}

		Timings.end();

		if (routeFileBuildResult.error) {
			Log.writeln(chalk.bgRed.whiteBright(` Build ${routeFile.oxiaRelPath} failed `));
			Log.error(routeFileBuildResult.error);
		} else {
			Timings.printOne(options.main.timings ? -1 : 0);
		}

		routeFileBuildResults.push(routeFileBuildResult);
	}

	return routeFileBuildResults;
}

/** Copies all static files to dist */
function copyStaticFiles(options: ResolvedOptions) {
	const paths = options.paths;
	if (!existsSync(paths.static)) {
		return;
	}
	Log.debug("copying", paths.static, "=>", paths.distStatic);
	const t0 = performance.now();
	copyDir(paths.static, paths.distStatic);
	const t1 = performance.now();
	Log.info("copy   ", (t1 - t0).toFixed(), "ms");
}

/**
 * DEV MODE
 * - Clean dist
 * - Build to dist
 * - Watch (Optional)
 * - OnChange: Clean and build
 * - DevServer: /dist and /static (serving static directly)
 *
 * BUILD MODE
 * - Clean dist
 * - Build to dist
 * - Copy static to dist
 * - Watch (Optional)
 * - OnChange: Clean and build and copy
 * - DevServer: /dist (serving static also from dist)
*/
async function _run(options: ResolvedOptions, changedFiles: string[] | "all", changeType: ChangeType) {

	Timings.reset();

	let routeFileBuildResults: RouteFileBuildResult[] = [];

	if (options.main.rebuildAll) {
		if (changeType === "sources") {
			changedFiles = "all";
		}
	}

	if (changeType === "sources" || changeType === "all") {

		// CLEAN DIST
		if (changedFiles === "all") {
			cleanDst(options);
		}

		// BUILD
		routeFileBuildResults = await build(options, changedFiles);

		if (options.main.dumpMemFsToConsole) {
			MemFs.getInstance().dumpToConsole(options);
		}
		if (options.main.dumpMemFsToDisk) {
			MemFs.getInstance().dumpToDisk(options);
		}
	}

	// COPY
	if (options.main.cmd === "build") {
		copyStaticFiles(options);
	}

	// RELOAD
	if (routeFileBuildResults.length) {
		const routesToReload = routeFileBuildResults.map(r => r.routeFile.routePath);
		reloadServer(routesToReload);
	}

	const ok = routeFileBuildResults.find(r => !!r.error) === undefined;
	if (ok) {
		if (routeFileBuildResults.length) {
			Timings.printSum();
		}
	} else {
		Log.writeln(`${chalk.bgRed.whiteBright(" Build failed! ")}`);
	}
}

const mutexes: Promise<void>[] = [];
async function run(options: ResolvedOptions, changedFiles: string[] | "all", changeType: ChangeType) {
	const otherMutexes = [...mutexes];

	let myResolve: ((value: void | PromiseLike<void>) => void) | undefined;
	const myMutex = new Promise<void>(async resolve => {
		myResolve = resolve;
	});
	mutexes.push(myMutex);
	await Promise.all(otherMutexes);

	try {
		await _run(options, changedFiles, changeType);
	} finally {
		myResolve!();
		const ind = mutexes.indexOf(myMutex);
		mutexes.splice(ind, 1);
	}
}

function startWatchingSource(options: ResolvedOptions) {
	if (!options.main.watch) return;

	let dirs = [
		options.paths.source,
	];
	dirs = dirs.filter(dir => existsSync(dir));
	if (dirs.length === 0) {
		Log.warn("no source dir to watch");
		return;
	}

	const watcher = chokidar.watch(dirs);
	watcher.on("ready", () => {
		Log.info("watching", dirs.length === 1 ? dirs[0] : dirs);
		watcher.on("add", onWatcher);
		watcher.on("change", onWatcher);
		watcher.on("unlink", onWatcher);
	});

	const changedFiles = new Set<string>();

	async function onWatcher(path: string, stats?: Stats) {
		path = slashify(path);
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
			await onSourceFilesChanged(options, changedPaths);
		}, 50);
	}
}

function startWatchingStatic(options: ResolvedOptions) {
	if (!options.main.watch) return;

	let dirs = [
		options.paths.static,
	];
	dirs = dirs.filter(dir => existsSync(dir));
	if (dirs.length === 0) {
		Log.warn("no static dir to watch");
		return;
	}

	const watcher = chokidar.watch(dirs);
	watcher.on("ready", () => {
		Log.info("watching", dirs.length === 1 ? dirs[0] : dirs);
		watcher.on("add", onWatcher);
		watcher.on("change", onWatcher);
		watcher.on("unlink", onWatcher);
	});

	const changedFiles = new Set<string>();

	async function onWatcher(path: string, stats?: Stats) {
		path = slashify(path);
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
			await onStaticFilesChanged(options, changedPaths);
		}, 50);
	}
}

async function startServer(options: ResolvedOptions) {
	if (!options.main.server) return;
	await startDevServer(options);
}

function reloadServer(routesToReload: string[]) {
	reloadDevServer(routesToReload);
}

async function onSourceFilesChanged(options: ResolvedOptions, changedFiles: string[] | "all") {
	await run(options, changedFiles, "sources");
}

async function onStaticFilesChanged(options: ResolvedOptions, changedFiles: string[] | "all") {
	await run(options, changedFiles, "static");
}

async function init(cmd: MainCommand) {
	const options = await initArgs(cmd);

	// Store global props
	(globalThis as any).GlobalProps = options.globalProps;

	return options;
}

export default async function main(cmd: MainCommand) {
	let version = "";
	try {
		version = JSON.parse(readFileSync(join(dirname(realpathSync(process.argv[1])), "package.json"), "utf8")).version;
	} catch (error) {
		console.error(error);
	}

	Log.writeln(`${chalk.bgBlue.white(" Oxia ")} ${chalk.gray(version)}`);

	const options = await init(cmd);

	await run(options, "all", "all");

	startWatchingSource(options);
	startWatchingStatic(options);

	startServer(options);
}
