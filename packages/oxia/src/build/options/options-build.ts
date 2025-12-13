import type { BuildOptions, MainCommand, ResolvedBuildOptions } from "../../config/types.js";

export function defaultBuildOptions() {
	const out: BuildOptions = {
	};
	return out;
}

export function resolveBuildOptions(cmd: MainCommand, buildOptions: BuildOptions): ResolvedBuildOptions {
	const out: ResolvedBuildOptions = {
		scopedStyleStrategy: buildOptions.scopedStyleStrategy ?? "attribute",
		format: buildOptions.format ?? false,
		tabWidth: buildOptions.tabWidth ?? 4,
		useTabs: buildOptions.useTabs ?? false,
		keepFragments: !!buildOptions.keepFragments,
		keepSlots: !!buildOptions.keepSlots,
	};
	return out;
}
