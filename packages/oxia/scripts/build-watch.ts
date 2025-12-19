import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "child_process";
import chokidar from "chokidar";
import { existsSync, statSync } from "fs";
import { platform, tmpdir } from "os";
import { join } from "path";
import { argv, env } from "process";
import { TscWatchClient } from "tsc-watch/client.js";
import { buildClean, buildDone, dstDir, slashify, srcDir, touchFile } from "./build-util.ts";

// The dir we got called from. For example, /oxia/packages/test-projects/simple
// After building, we call "pnpm run dev" in the calling dir.
const callbackDir = slashify(`${env.INIT_CWD}`);
let callbackProcess: ChildProcessWithoutNullStreams | undefined = undefined;

const initFile = slashify(join(tmpdir(), "oxia", "build-watch-init"));
const doneFile = slashify(join(tmpdir(), "oxia", "build-watch-done"));

function initBuilding() {
	if (existsSync(initFile)) {
		const time = statSync(initFile).atime;
		const now = new Date();
		const passed = now.getTime() - time.getTime();
		if (passed < 5000) return false;
	} else {
		touchFile(initFile);
	}
	setInterval(() => {
		touchFile(initFile);
	}, 3000);
	return true;
}

function startBuilding() {
	if (initBuilding()) {
		// The calling script is the first caller, so let it handle building
		runBuild();
		return true;
	} else {
		// The calling script is not the first caller
		const interval = setInterval(() => {
			// Check if the first caller has exited and take over building
			if (initBuilding()) {
				runBuild();
				clearInterval(interval);
			}
		}, 1000);
		return false;
	}
}

async function runBuild() {
	// *** CLEAN ***
	buildClean();

	const tscWatch = new TscWatchClient();

	tscWatch.on("started", () => {
		console.log("building", dstDir);
	});

	let isFirstSuccess = true;
	tscWatch.on("success", () => {
		// *** DONE ***
		buildDone();

		if (isFirstSuccess) {
			isFirstSuccess = false;
			console.log("watching", srcDir);
		}

		// Trigger build output watchers
		touchFile(doneFile);
	});

	tscWatch.on("compile_errors", () => {
		console.log("\nCOMPILATION FAILED\n");
	});

	// *** BUILD ***
	tscWatch.start("-p", "tsconfig.build.json", "--compileCommand", "tsgo", "--noClear", "--silent");
}

async function startWatching(isFirst: boolean) {
	if (isFirst) {
		touchFile(doneFile);
	} else {
		execCallback();
	}
	const watcher = chokidar.watch(doneFile);
	watcher.on("ready", () => {
		watcher.on("change", execCallback);
	});
}

function execCallback() {
	const isFirstInvoke = !callbackProcess;

	killCallback(callbackProcess);

	const args = argv.slice(2).join(" ");
	callbackProcess = spawn(`pnpm${isFirstInvoke ? "" : " --silent"} --color run dev ${args}`, [], { cwd: callbackDir, shell: true });

	// console.log("spawned callback PID", callbackProcess.pid);

	callbackProcess.stdout.on("data", (data) => {
		process.stdout.write(data);
	});

	callbackProcess.stderr.on("data", (data) => {
		process.stderr.write(data);
	});
}

function killCallback(callbackProcess: ChildProcessWithoutNullStreams) {
	if (!callbackProcess) return;

	// console.log("killing callback PID", callbackProcess.pid);

	if (platform() === "win32") {
		spawnSync(`taskkill /pid ${callbackProcess.pid} /t /f`, [], { shell: true });
	} else {
		callbackProcess.kill(-callbackProcess.pid!);
	}
	callbackProcess = undefined;
}

const isFirst = startBuilding();
startWatching(isFirst);
