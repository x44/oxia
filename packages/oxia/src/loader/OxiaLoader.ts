import { type LoadFnOutput, type LoadHookContext, registerHooks, type ResolveFnOutput, type ResolveHookContext } from "module";
import { oxia2tsx } from "../build/oxia2tsx/index.js";
import type { MemFs } from "../memfs/MemFs.js";
import { Timings } from "../util/timings.js";
import { DependencyGraph } from "./DependencyGraph.js";
import { isProjectFile, resolveSpecifier, specifier2file, toUrl, transpileToJs, url2file, withExtension } from "./loader-util.js";

/** Module loader for oxia files */
export class OxiaLoader {
	private static instance: OxiaLoader;
	private memFs;
	private importMappings = new Map<string, string>();

	private projectSrcDir: string | undefined = undefined;
	private timestamp = 0;

	private dependencyGraph = new DependencyGraph();

	private oxiaFileResolvedListener?: (absFile: string) => void;

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

	static beforeImport(projectSrcDir: string, timestamp: number) {
		OxiaLoader.instance.projectSrcDir = projectSrcDir;
		OxiaLoader.instance.timestamp = timestamp;
		OxiaLoader.instance.dependencyGraph.start();
	}

	static afterImport() {
		OxiaLoader.instance.dependencyGraph.purge();
	}

	static invalidateAll() {
		OxiaLoader.instance.memFs.clear();
		OxiaLoader.instance.dependencyGraph.invalidateAll(OxiaLoader.instance.timestamp);
	}

	static invalidate(changedFiles: string[]) {
		OxiaLoader.instance.memFs.removeFiles(changedFiles);
		OxiaLoader.instance.dependencyGraph.invalidate(changedFiles, OxiaLoader.instance.timestamp);
	}

	static setOxiaFileResolvedListener(oxiaFileResolvedListener: ((absFile: string) => void) | undefined) {
		OxiaLoader.instance.oxiaFileResolvedListener = oxiaFileResolvedListener;
	}

	private resolve(specifier: string, context: ResolveHookContext, nextResolve: (specifier: string, context?: Partial<ResolveHookContext>) => ResolveFnOutput) {
		// console.log("OxiaLoader: resolving:", specifier, context.parentURL);
		const originalSpecifier = specifier;

		specifier = this.importMappings.get(specifier) || specifier;

		const absFile = resolveSpecifier(specifier, context.parentURL);

		if (absFile !== undefined) {
			let timestamp: number | undefined = undefined;

			const isFileInProject = isProjectFile(this.projectSrcDir, absFile);

			if (isFileInProject) {
				let absParentFile = context.parentURL ? specifier2file(context.parentURL) : undefined;
				const isParentInProject = isProjectFile(this.projectSrcDir, absParentFile);
				if (!isParentInProject) {
					absParentFile = undefined;
				}

				this.dependencyGraph.add(absParentFile, absFile, this.timestamp);

				timestamp = this.dependencyGraph.getTimestamp(absFile);
			}

			if (absFile.endsWith(".oxia")) {

				if (this.oxiaFileResolvedListener) {
					this.oxiaFileResolvedListener(absFile);
				}

				const absUrl = toUrl(absFile, timestamp);
				// console.log("OxiaLoader: resolved:", absUrl);

				return {
					url: absUrl,
					format: "module",
					shortCircuit: true,
				};
			}

			if (absFile.endsWith(".ts") || specifier.endsWith(".tsx")) {
				const absUrl = toUrl(absFile, timestamp);
				// console.log("OxiaLoader: resolved:", absUrl);

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
		// console.log("OxiaLoader: loading", url);

		if (url.startsWith("file:///")) {
			const file = url2file(url);

			if (file.endsWith(".oxia")) {
				// console.log("OxiaLoader: loading", url);
				const jsCode = loadJsFromOxiaFile(this.memFs, file);

				return {
					format: "module",
					responseUrl: url,
					source: jsCode,
					shortCircuit: true,
				};
			}

			if (file.endsWith(".tsx") || file.endsWith(".ts")) {
				// console.log("OxiaLoader: loading", url);
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
	// console.log("loadJsFromOxiaFile", oxiaFilePath);

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
	// console.log("loadJsFromTsOrTsxFile", tsOrTsxFilePath);

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
