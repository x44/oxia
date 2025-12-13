import { basename, dirname, isAbsolute } from "node:path";
import type { ResolvedOptions } from "../../config/types.js";
import { absPath, joinedPath, relPath, slashify } from "../../util/fs.js";

export type BuildFile = {
	/** The name without extension. ('index') ('about') ('Component')*/
	name: string;

	/** Relative to project 'src' ('routes/index.oxia') or absolute ('/xxx/src/routes/index.oxia'). */
	oxiaFilePath: string;
	/** Basename ('index.oxia') */
	oxiaFileName: string;
	/** Absolute ('/xxx/src/routes/index.oxia') */
	oxiaAbsPath: string;
	/** Relative to project 'src' ('routes/index.oxia') */
	oxiaRelPath: string;
}

/**
@example
Source oxia                           Dist html                                           Route            RoutePath          RouteName
-----------------------------------------------------------------------------------------------------------------------------------------
/src/routes/index.oxia                /dist/index.html                                    ''               '/'               'index'
/src/routes/about.oxia                /dist/about/index.html         ! Note the clash     'about'          '/about'          'about'
/src/routes/about/index.oxia          /dist/about/index.html         ! Note the clash     'about'          '/about'          'about'
/src/routes/other/index.oxia          /dist/other/index.html                              'other'          '/other'          'other'
/src/routes/other/about.oxia          /dist/other/about/index.html   ! Note the clash     'other/about'    '/other/about'    'other/about'
/src/routes/other/about/index.oxia    /dist/other/about/index.html   ! Note the clash     'other/about'    '/other/about'    'other/about'
*/
export type RouteFile = BuildFile & {
	/** Route */
	route: string;
	/** Route path *with* leading '/' */
	routePath: string;
	/** Route name */
	routeName: string;
	/** Absolute ('/xxx/dist/index.html') ('/xxx/dist/about/index.html')*/
	htmlAbsPath: string;
}

export function createBuildFile(options: ResolvedOptions, oxiaFilePath: string): BuildFile {
	const paths = options.paths;

	oxiaFilePath = slashify(oxiaFilePath);
	const name = basename(oxiaFilePath, ".oxia");

	const oxiaFileName = basename(oxiaFilePath);
	const oxiaAbsPath = isAbsolute(oxiaFilePath) ? oxiaFilePath : absPath(paths.source, oxiaFilePath);
	const oxiaRelPath = relPath(paths.source, oxiaAbsPath);

	const file: BuildFile = {
		name,

		oxiaFilePath,
		oxiaFileName,
		oxiaAbsPath,
		oxiaRelPath,
	};
	return file;
}

export function createRouteFile(options: ResolvedOptions, oxiaFilePath: string): RouteFile {
	const paths = options.paths;

	const base = createBuildFile(options, oxiaFilePath);

	const routeSubDir = relPath(paths.routes, dirname(base.oxiaAbsPath));

	let route = base.oxiaFileName.toLocaleLowerCase() === "index.oxia"
		? routeSubDir
		: joinedPath(routeSubDir, base.name);

	route = route.toLocaleLowerCase();

	const routePath = `/${route}`;

	const routeName = route === ""
		? "index"
		: route;

	const htmlAbsPath = absPath(paths.distRoutes, route, "index.html");

	const file: RouteFile = {
		...base,
		route,
		routePath,
		routeName,
		htmlAbsPath,
	};
	return file;
}
