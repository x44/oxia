import { type LoadFnOutput, type LoadHookContext, registerHooks, type ResolveFnOutput, type ResolveHookContext } from "module";
import { oxia2tsx } from "../build/oxia2tsx/index.js";
import type { MemFs } from "../memfs/MemFs.js";
import { Timings } from "../util/timings.js";
import { isProjectFile, resolveSpecifier, toUrl, transpileToJs, url2file, withExtension } from "./loader-util.js";

/** Module loader for oxia files */
export class OxiaLoader {
	private static instance: OxiaLoader;
	private memFs;
	private importMappings = new Map<string, string>();

	private projectSrcDir: string | undefined = undefined;
	private timestamp = 0;

	constructor(memFs: MemFs) {
		OxiaLoader.instance = this;
		this.memFs = memFs;
	}

	addImportMapping(from: string, to: string) {
		this.importMappings.set(from, to);
	}

	register() {
		registerHooks({
			resolve: (specifier, context, nextResolve) => this.resolve(specifier, context, nextResolve),
			load: (url, context, nextLoad) => this.load(url, context, nextLoad),
		});
	}

	static invalidateAllFiles(projectSrcDir: string, timestamp: number) {
		OxiaLoader.instance.projectSrcDir = projectSrcDir;
		OxiaLoader.instance.timestamp = timestamp;
		OxiaLoader.instance.memFs.clear();
	}

	static invalidateFiles(projectSrcDir: string, timestamp: number, changedFiles: string[]) {
		OxiaLoader.instance.projectSrcDir = projectSrcDir;
		OxiaLoader.instance.timestamp = timestamp;
		OxiaLoader.instance.memFs.removeFiles(changedFiles);
	}

	private resolve(specifier: string, context: ResolveHookContext, nextResolve: (specifier: string, context?: Partial<ResolveHookContext>) => ResolveFnOutput) {
		// Log.log("OxiaLoader: resolving:", specifier, context.parentURL);
		const originalSpecifier = specifier;

		specifier = this.importMappings.get(specifier) || specifier;

		const absFile = resolveSpecifier(specifier, context.parentURL);

		if (absFile !== undefined) {
			let timestamp: number | undefined = undefined;

			const isFileInProject = isProjectFile(this.projectSrcDir, absFile);

			if (isFileInProject) {
				timestamp = this.timestamp;
			}

			if (absFile.endsWith(".oxia") || absFile.endsWith(".ts") || specifier.endsWith(".tsx")) {
				const absUrl = toUrl(absFile, timestamp);
				// Log.log("OxiaLoader: resolved:", absUrl);
				return {
					url: absUrl,
					format: "module",
					shortCircuit: true,
				};
			}
		}

		return nextResolve(originalSpecifier, context);
	}

	private load(url: string, context: LoadHookContext, nextLoad: (url: string, context?: Partial<LoadHookContext>) => LoadFnOutput) {
		// Log.log("OxiaLoader: loading", url);
		if (url.startsWith("file:///")) {
			const file = url2file(url);

			if (file.endsWith(".oxia")) {
				// Log.log("OxiaLoader: loading", url);
				const jsCode = loadJsFromOxiaFile(this.memFs, file);

				return {
					format: "module",
					responseUrl: url,
					source: jsCode,
					shortCircuit: true,
				};
			}

			if (file.endsWith(".tsx") || file.endsWith(".ts")) {
				// Log.log("OxiaLoader: loading", url);
				const jsCode = loadJsFromTsOrTsxFile(this.memFs, file);

				return {
					format: "module",
					responseUrl: url,
					source: jsCode,
					shortCircuit: true,
				};
			}
		}

		return nextLoad(url, context);
	}
}

function loadJsFromOxiaFile(memFs: MemFs, oxiaFilePath: string) {
	// Log.log("loadJsFromOxiaFile", oxiaFilePath);

	const jsFilePath = withExtension(oxiaFilePath, ".js");
	if (!memFs.exists(oxiaFilePath)) {
		// Load from disk fs to mem fs
		const oxiaCode = memFs.loadTextFile(oxiaFilePath);
		const tsxCode = oxia2tsx(oxiaFilePath, oxiaCode);

		Timings.begin("transpile");
		const jsCode = transpileToJs(tsxCode);
		Timings.end();

		// Store tsx in mem fs
		const tsxFilePath = withExtension(oxiaFilePath, ".tsx");
		memFs.writeTextFile(tsxFilePath, tsxCode);

		// Store js in mem fs
		memFs.writeTextFile(jsFilePath, jsCode);
		return jsCode;
	}

	// If the oxiaFilePath exists, we assume that all steps (oxia -> tsx -> js) were already performed.
	// The user of this loader is responsible to remove the oxia file from mem fs for reloading.
	const jsCode = memFs.readTextFile(jsFilePath);
	return jsCode;
}

function loadJsFromTsOrTsxFile(memFs: MemFs, tsOrTsxFilePath: string) {
	// Log.log("loadJsFromTsOrTsxFile", tsOrTsxFilePath);

	const jsFilePath = withExtension(tsOrTsxFilePath, ".js");
	if (!memFs.exists(tsOrTsxFilePath)) {
		// Load from disk fs to mem fs
		const tsOrTsxCode = memFs.loadTextFile(tsOrTsxFilePath);

		Timings.begin("transpile");
		const jsCode = transpileToJs(tsOrTsxCode);
		Timings.end();

		// Store js in mem fs
		memFs.writeTextFile(jsFilePath, jsCode);
		return jsCode;
	}

	// If the tsOrTsxFilePath exists, we assume that all steps (ts/tsx -> js) were already performed.
	// The user of this loader is responsible to remove the ts/tsx file from mem fs for reloading.
	const jsCode = memFs.readTextFile(jsFilePath);
	return jsCode;
}
