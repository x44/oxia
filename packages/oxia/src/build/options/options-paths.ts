import { isAbsolute, join, resolve } from "node:path";
import type { PathOptions, ResolvedBuildOptions, ResolvedPathOptions } from "../../config/types.js";
import { absolute, isPathEqualOrInside, slashify } from "../../util/fs.js";

/**
 * Returns unresolved default paths with the optional rootDir as root.
 * @param root Optional root dir. @default ""
 * @returns Unresolved PathOptions object.
 */
export function defaultPathOptions(root = "") {
	const out: PathOptions = {
		root: root,
	} as PathOptions;

	return out;
}

/**
 * Resolves the dirs in pathOptions to absolute dirs.
 * @param pathOptions The unresolved paths.
 * @returns The resolved paths.
 */
export function resolvePathOptions(pathOptions: PathOptions, buildOptions: ResolvedBuildOptions): ResolvedPathOptions {
	const root = absolute(pathOptions.root || "");
	const source = absolute(join(root, "src"));
	const dist = optionalAbsolute(root, pathOptions.dist, "dist");

	const out: ResolvedPathOptions = {
		root,
		source,

		routes: optionalAbsolute(source, pathOptions.routes, "routes"),
		static: optionalAbsolute(root, pathOptions.static, "static"),

		distStatic: optionalAbsolute(dist, pathOptions.distStatic, ""),
		distRoutes: optionalAbsolute(dist, pathOptions.distRoutes, ""),
	};

	if (!isPathEqualOrInside(out.source, out.routes)) {
		throw new Error("routesDir must be equal to or inside of sourceDir");
	}

	return out;
}

function optionalAbsolute(parentPath: string, subPathRelOrAbs: string | undefined, defSubPathRelOrAbs: string) {
	if (subPathRelOrAbs === undefined) subPathRelOrAbs = defSubPathRelOrAbs;
	if (isAbsolute(subPathRelOrAbs)) return slashify(subPathRelOrAbs);
	return slashify(resolve(join(parentPath, subPathRelOrAbs)));
}
