import type { MainCommand, MainOptions, ResolvedMainOptions } from "../../config/types.js";

export function defaultStartOptions() {
	const out: MainOptions = {
	};
	return out;
}

export function resolveStartOptions(cmd: MainCommand, startOptions: MainOptions): ResolvedMainOptions {
	const out: ResolvedMainOptions = {
		cmd,
		watch: startOptions.watch ?? cmd === "dev",
		rebuildAll: !!startOptions.rebuildAll,
		debug: !!startOptions.debug,
		timings: !!startOptions.timings,
		server: startOptions.server ?? cmd === "dev",
		dumpMemFsToConsole: !!startOptions.dumpMemFsToConsole,
		dumpMemFsToDisk: !!startOptions.dumpMemFsToDisk,
	};
	return out;
}
