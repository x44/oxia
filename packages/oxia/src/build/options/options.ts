import type { MainCommand, Options, ResolvedOptions } from "../../config/types.js";
import { defaultBuildOptions, resolveBuildOptions } from "./options-build.js";
import { defaultStartOptions, resolveStartOptions } from "./options-main.js";
import { defaultPathOptions, resolvePathOptions } from "./options-paths.js";
import { defaultServerOptions, resolveServerOptions } from "./options-server.js";

export function defaultOptions() {
	const options: Options = {
		main: defaultStartOptions(),
		build: defaultBuildOptions(),
		paths: defaultPathOptions(),
		server: defaultServerOptions(),
		globalProps: {},
	};
	return options;
}

export function resolveOptions(cmd: MainCommand, options: Options): ResolvedOptions {
	// Keep this order!
	const resolvedStartOptions = resolveStartOptions(cmd, options.main);
	const resolvedBuildOptions = resolveBuildOptions(cmd, options.build);
	const resolvedPathOptions = resolvePathOptions(options.paths, resolvedBuildOptions);
	const resolvedServerOptions = resolveServerOptions(options.server, resolvedStartOptions, resolvedPathOptions);

	const resolvedOptions: ResolvedOptions = {
		main: resolvedStartOptions,
		build: resolvedBuildOptions,
		paths: resolvedPathOptions,
		server: resolvedServerOptions,
		globalProps: {
			...options.globalProps
		}
	};

	return resolvedOptions;
}
