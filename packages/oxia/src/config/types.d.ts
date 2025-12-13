import type { GlobalProps } from "../react/types.js";

export type MainCommand = "dev" | "build";

export type MainOptions = {
	/**
	 * Whether to run in watch mode.
	 * @default true in dev, false in build
	 */
	watch?: boolean;
	/**
	 * Whether to rebuild all files when any file changes.
	 * @default false
	*/
	rebuildAll?: boolean;
	/**
	 * Whether to print debug messages.
	 * @default false
	 */
	debug?: boolean;
	/**
	 * Whether to print detailed timings.
	 * @default false
	 */
	timings?: boolean;
	/**
	 * Whether to run the dev server.
	 * @default true in dev, false in build
	 */
	server?: boolean;
	/**
	 * Whether to dump the mem fs to console.
	 * @default false;
	 */
	dumpMemFsToConsole?: boolean;
	/**
	 * Whether to dump the mem fs to disk.
	 * @default false;
	 */
	dumpMemFsToDisk?: boolean;
}

export type ResolvedMainOptions = Required<MainOptions> & {
	cmd: MainCommand;
};

export type ScopedStyleStrategy = "attribute" | "class" | "where";

export type BuildOptions = {
	/**
	 * Style scoping strategy to use.
	 * @default: "attribute"
	 */
	scopedStyleStrategy?: ScopedStyleStrategy;
	/**
	 * Format the HTML output.
	 * @default false
	 */
	format?: boolean;
	/**
	 * Indent lines with tabs instead of spaces.
	 * @default false
	 */
	useTabs?: boolean;
	/**
	 * Specify the number of spaces per indentation-level.
	 * @default 2
	 */
	tabWidth?: number;
	/**
	 * Keep \<fragments\> for debugging.
	 */
	keepFragments?: boolean;
	/**
	 * Keep \<slots\> for debugging.
	 */
	keepSlots?: boolean;
}

export type ResolvedBuildOptions = Required<BuildOptions>;

export type PathOptions = {
	/**
	 * Input and output root dir relative to the project root dir or absolute.
	 * @default "" -> "/project"
	 */
	root?: string;
	/**
	 * Input static or public dir relative to root or absolute.
	 * @default "static" -> "/project/static"
	 */
	static?: string;
	/**
	 * Input routes dir relative to root. This must resolve to a path equal to or inside of /project/src.
	 * @default "routes" -> "/project/src/routes"
	 */
	routes?: string;
	/**
	 * Output dir relative to root or absolute.
	 * @default "dist" -> "/project/dist"
	 */
	dist?: string;
	/**
	 * Output static dir relative to dist or absolute.
	 * @default "" -> "/project/dist"
	 */
	distStatic?: string;
	/**
	 * Output routes dir relative to dist or absolute.
	 * @default "" -> "/project/dist"
	 */
	distRoutes?: string;
}

export type ResolvedPathOptions = Required<Omit<PathOptions, "dist">> & {
	source: string;
};

export type ServerOptions = {
	/**
	 * Server port.
	 * @default 3000
	 */
	port?: number;
	/**
	 * Server host.
	 * @default 127.0.0.1
	 */
	host?: string;
	/**
	 * Open browser.
	 * @default false
	 */
	open?: boolean;
	/**
	 * The route to open in the browser.
	 * @default ""
	 */
	route?: string;
	/**
	 * Start additional dev server that serves highlighted HTML source code.
	 * @default false
	 */
	code?: boolean;
}

export type ResolvedServerOptions = Required<ServerOptions> & {
	/**
	 * Routes dir.
	 */
	routes: string;
	/**
	 * Static (public) dir.
	 */
	static: string;
};

export type Options = {
	main: MainOptions;
	build: BuildOptions;
	paths: PathOptions;
	server: ServerOptions;
	globalProps?: GlobalProps;
}

export type ResolvedOptions = {
	main: ResolvedMainOptions;
	build: ResolvedBuildOptions;
	paths: ResolvedPathOptions;
	server: ResolvedServerOptions;
	globalProps: GlobalProps;
}

export type Config = Partial<Options>;
