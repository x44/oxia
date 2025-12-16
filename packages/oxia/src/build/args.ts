import { existsSync, readFileSync } from "node:fs";
import type { Config, MainCommand, Options, ResolvedOptions } from "../config/types.js";
import type { GlobalProps } from "../react/types.js";
import { hasHelpArg } from "../util/args.js";
import { absPath } from "../util/fs.js";
import { Log, LogLevel } from "../util/log.js";
import { DEFAULT_SERVER_PORT } from "./options/options-server.js";
import { defaultOptions, resolveOptions } from "./options/options.js";

type WritableGlobalProps = {
	-readonly [K in keyof GlobalProps]: GlobalProps[K]
}

export async function initArgs(cmd: MainCommand): Promise<ResolvedOptions> {

	if (hasHelpArg()) {
		printHelpAndExit(cmd);
	}

	// Defaults
	let options = defaultOptions();

	// oxia.json / oxia.config.ts
	options = await readConfig(options);

	// args
	options = await parseArgs(options);

	Log.setLevel(options.main.debug ? LogLevel.DEBUG : LogLevel.INFO);

	// resolve paths, apply mode dependent options
	const resolvedOptions = resolveOptions(cmd, options);

	Log.debug("options");
	Log.debug(options);
	Log.debug("resolved options");
	Log.debug(resolvedOptions);

	return resolvedOptions;
}

function printHelpAndExit(cmd: MainCommand) {
	Log.log(`oxia ${cmd} [OPTIONS] GlobalPropKey=value ...`);

	Log.log("\nOPTIONS\n");
	Log.log("-cfg                            Config module or file. Default is 'oxia.config.ts' or 'oxia.config.json'");
	Log.log("-watch                          Enable file watching. Default is 'true' in dev mode and 'false' in build mode.");
	Log.log("-rebuild-all                    Always rebuild all files.");
	Log.log("-debug                          Enable debug messages.");
	Log.log("-timings                        Enable detailed timings output.");
	Log.log("-dump-memfs-to-console          Dump the content of MemFs to the console. Default is false.");
	Log.log("-dump-memfs-to-disk             Dump the content of MemFs to the disk. Default is false.");
	Log.log("-sss <attribute|class|where>    ScopedStyleStrategy. Default is 'attribute'.");
	Log.log("-format <true|false>            Format the HTML output. Default is 'true' in dev mode and 'false' in build mode.");
	Log.log("-tab-width <n>                  Number of spaces per indentation-level. Default is 2.");
	Log.log("-use-tabs <true|false>          Indent lines with tabs instead of spaces. Default is false.");
	Log.log("-keep-fragments                 Keep <fragments> for debugging.");
	Log.log("-keep-slots                     Keep <slots> for debugging.");

	Log.log("-root <dir>                     Root dir relative to the project root dir or absolute. Default is ''");
	Log.log("-static <dir>                   Input static dir relative to root or absolute. Default is 'static'");
	Log.log("-routes <dir>                   Input routes dir relative to src. This must resolve to a path equal to or inside of src. Default is 'routes'");
	Log.log("-dist <dir>                     Output dir relative to root or absolute. Default is 'dist'");
	Log.log("-dist-static <dir>              Output static dir relative to dist or absolute. Default is ''");
	Log.log("-dist-routes <dir>              Output routes dir relative to dist or absolute. Default is ''");

	Log.log("");
	Log.log("-server <true|false>            Whether to use the dev server. Default is 'true' in dev mode and 'false' in build mode.");
	Log.log(`-port <port>                    Server port. Default is ${DEFAULT_SERVER_PORT}`);
	Log.log("-host <host>                    Server host. Default is 127.0.0.1");
	Log.log("-open                           Open the browser.");
	Log.log("-route                          The route to open in the browser. Default is ''");
	Log.log("-code                           Start additional server for highlighted HTML source code.");
	Log.log("");
	process.exit(0);
}

function parseArgs(options: Options) {
	const startOptions = options.main;
	const buildOptions = options.build;
	const pathOptions = options.paths;
	const serverOptions = options.server;

	for (let i = 2; i < process.argv.length; ++i) {
		const arg = process.argv[i];
		if (arg === "-watch") {
			startOptions.watch = true;
		} else
		if (arg === "-rebuild-all") {
			startOptions.rebuildAll = true;
		} else
		if (arg === "-debug") {
			startOptions.debug = true;
		} else
		if (arg === "-timings") {
			startOptions.timings = true;
		} else
		if (arg === "-dump-memfs-to-console") {
			startOptions.dumpMemFsToConsole = true;
		} else
		if (arg === "-dump-memfs-to-disk") {
			startOptions.dumpMemFsToDisk = true;
		} else
		if (arg === "-sss") {
			const v = process.argv[++i];
			buildOptions.scopedStyleStrategy = v === "class" || v === "where" ? v : "attribute";
		} else
		if (arg === "-format") {
			buildOptions.format = process.argv[++i] === "true";
		} else
		if (arg === "-tab-width") {
			buildOptions.tabWidth = parseInt(process.argv[++i]);
		} else
		if (arg === "-use-tabs") {
			buildOptions.useTabs = process.argv[++i] === "true";
		} else
		if (arg === "-keep-fragments") {
			buildOptions.keepFragments = true;
		} else
		if (arg === "-keep-slots") {
			buildOptions.keepSlots = true;
		} else
		if (arg === "-root") {
			pathOptions.root = process.argv[++i];
		} else
		if (arg === "-static") {
			pathOptions.static = process.argv[++i];
		} else
		if (arg === "-routes") {
			pathOptions.routes = process.argv[++i];
		} else
		if (arg === "-dist") {
			pathOptions.dist = process.argv[++i];
		} else
		if (arg === "-dist-static") {
			pathOptions.distStatic = process.argv[++i];
		} else
		if (arg === "-dist-routes") {
			pathOptions.distRoutes = process.argv[++i];
		} else
		if (arg === "-server") {
			startOptions.server = process.argv[++i] === "true";
		} else
		if (arg === "-port") {
			serverOptions.port = parseInt(process.argv[++i]);
		} else
		if (arg === "-host") {
			serverOptions.host = process.argv[++i];
		} else
		if (arg === "-open") {
			serverOptions.open = true;
		} else
		if (arg === "-route") {
			serverOptions.route = process.argv[++i];
		} else
		if (arg === "-code") {
			serverOptions.code = true;
		}
	}

	if (!options.globalProps) {
		options.globalProps = {};
	}

	const globalProps = options.globalProps as WritableGlobalProps;

	for (let i = 2; i < process.argv.length; ++i) {
		const arg = process.argv[i];
		if (!arg.startsWith("-") && arg.includes("=")) {
			const [key, val] = arg.split("=");
			globalProps[key] = val;
		}
	}

	return options;
}

async function readConfig(options: Options) {
	let cfgFile = "";

	for (let i = 2; i < process.argv.length; ++i) {
		const arg = process.argv[i];
		if (arg === "-cfg") {
			cfgFile = process.argv[++i];
			// Do *not* break, since we may have multiple args with the same name (when npm script has -cfg and the npm script is run with -- -cfg)
		}
	}

	if (cfgFile !== "") {
		// Explicit cfg file. Fail if not exists.
		cfgFile = absPath(cfgFile);
		if (!existsSync(cfgFile)) {
			Log.error("config not exists", cfgFile);
			process.exit(1);
		}
	} else {
		// Default cfg file. Ignore if not exists.
		cfgFile = absPath("oxia.config.ts");
		if (!existsSync(cfgFile)) {
			cfgFile = absPath("oxia.config.json");
			if (!existsSync(cfgFile)) {
				cfgFile = "";
			}
		}
	}

	if (cfgFile !== "") {
		let fileOptions: Config;

		if (cfgFile.endsWith(".json")) {
			Log.info("reading config", cfgFile);
			fileOptions = JSON.parse(readFileSync(cfgFile, "utf8"));
		} else {
			Log.info("loading config", cfgFile);
			const module = await import(cfgFile);
			fileOptions = module.default;
		}

		options = {
			main: {
				...options.main,
				...fileOptions.main,
			},
			paths: {
				...options.paths,
				...fileOptions.paths,
			},
			build: {
				...options.build,
				...fileOptions.build,
			},
			server: {
				...options.server,
				...fileOptions.server,
			},
			globalProps: {
				...options.globalProps,
				...fileOptions.globalProps,
			}
		};
	}

	return options;
}