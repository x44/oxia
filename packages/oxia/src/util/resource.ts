import { joinedPath, relPath } from "./fs.js";

/**
 * Takes as input a dist dir, route dir, a destination path and an option whether to
 * generate an absolute or relative reference.
 * Returns the absolute resource file path an the reference to the resource file.
 * @param absDistDir The absolute dist dir - IE the server document root (/dist)
 * @param absRouteDir The absolute dir of the route (/dist/about)
 * @param dstFilePath The resource destination path.
 * If this starts with a '/' then the returned resource file path is in the dist dir.
 * Otherwise the returned resource file path is in the route dir.
 * @param refType Whether the returned resource reference shall be absolute or relative to
 * the route.
 */
export function toResourceFileAndReference(absDistDir: string, absRouteDir: string, dstFilePath: string, refType: "abs" | "rel") {
	let absDstFilePath;
	if (dstFilePath.startsWith("/")) {
		absDstFilePath = joinedPath(absDistDir, dstFilePath);
	} else {
		absDstFilePath = joinedPath(absRouteDir, dstFilePath);
	}

	let ref;
	if (refType === "abs") {
		ref = `/${relPath(absDistDir, absDstFilePath)}`;
	} else {
		ref = `${relPath(absRouteDir, absDstFilePath)}`;
	}

	return {
		absDstFilePath,
		ref
	}
}