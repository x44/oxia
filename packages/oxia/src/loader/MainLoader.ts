import * as fs from "fs";
import { type LoadFnOutput, type LoadHookContext, registerHooks, type ResolveFnOutput, type ResolveHookContext } from "module";
import { resolveSpecifier, toUrl, transpileToJs, url2file } from "./loader-util.js";

/**
 * Module loader for ts, tsx and oxia (oxia with simple syntax only).
 * Oxia files with simple syntax are, for example, in react/components.
 * This loader is used for the initial module loading.
 * It is separated from OxiaLoader because it has no dependencies.
 * This separation is required on macOS, but also works on Windows.
 */
export class MainLoader {
	private importMappings = new Map<string, string>();

	addImportMapping(from: string, to: string) {
		this.importMappings.set(from, to);
	}

	register() {
		registerHooks({
			resolve: (specifier, context, nextResolve) => this.resolve(specifier, context, nextResolve),
			load: (url, context, nextLoad) => this.load(url, context, nextLoad),
		});
	}

	private resolve(specifier: string, context: ResolveHookContext, nextResolve: (specifier: string, context?: Partial<ResolveHookContext>) => ResolveFnOutput) {
		// console.log("MainLoader: resolving:", specifier, context.parentURL);
		const originalSpecifier = specifier;

		specifier = this.importMappings.get(specifier) || specifier;

		if (specifier.endsWith(".ts") || specifier.endsWith(".oxia")) {

			const absFile = resolveSpecifier(specifier, context.parentURL);

			if (absFile !== undefined) {
				const absUrl = toUrl(absFile, undefined); // Note that we do *not* timestamp in MainLoader
				// console.log("MainLoader: resolved:", absUrl);
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
		if (url.startsWith("file:///")) {
			const file = url2file(url);

			if (file.endsWith(".tsx") || file.endsWith(".ts") || file.endsWith(".oxia")) {
				// console.log("MainLoader: loading", url);
				const jsCode = loadJsFromTsOrTsxFile(file);

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

function loadJsFromTsOrTsxFile(tsOrTsxFilePath: string) {
	const tsCode = fs.readFileSync(tsOrTsxFilePath, "utf8");
	const jsCode = transpileToJs(tsCode);
	return jsCode;
}
