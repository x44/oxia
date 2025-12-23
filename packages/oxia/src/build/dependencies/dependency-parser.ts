import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { Log } from "../../util/log.js";
import type { Node } from "./types.js";

export function parseImportsFromFile(path: string) {
	if (!(path.endsWith(".oxia") || path.endsWith(".ts") || path.endsWith(".js") || path.endsWith(".tsx") || path.endsWith(".jsx"))) {
		return [];
	}

	const code = readFileSync(path, "utf-8");
	const importPaths = parseImportsFromCode(code);
	if (!importPaths.length) return importPaths;

	return resolveImportPaths(path, importPaths);
}

function resolveImportPaths(importerPath: string, importPaths: string[]) {
	const dir = dirname(importerPath);

	const resolvedPaths: string[] = [];

	for (const importPath of importPaths) {
		let resolvedPath = resolve(join(dir, importPath));
		let exists = existsSync(resolvedPath);
		if (!exists) {
			let alternativePath;
			if (resolvedPath.endsWith(".js")) {
				alternativePath = withExtension(resolvedPath, ".ts");
			} else
			if (resolvedPath.endsWith(".ts")) {
				alternativePath = withExtension(resolvedPath, ".js");
			} else
			if (resolvedPath.endsWith(".jsx")) {
				alternativePath = withExtension(resolvedPath, ".tsx");
			} else
			if (resolvedPath.endsWith(".tsx")) {
				alternativePath = withExtension(resolvedPath, ".jsx");
			}
			if (alternativePath) {
				exists = existsSync(alternativePath);
				if (exists) {
					resolvedPath = alternativePath;
				}
			}
		}

		if (exists) {
			resolvedPaths.push(resolvedPath.replaceAll("\\", "/"));
		} else {
			// Log.warn("import not exists", importPath, "imported from", importerPath);
		}
	}
	return resolvedPaths;
}

function withExtension(path: string, ext: string) {
	return path.substring(0, path.lastIndexOf(".")) + ext;
}

export function parseImportsFromCode(code: string) {
	if (!code) return [];
	const importPaths = new Set<string>();

	const len = code.length;

	let pos = 0;

	while (pos < len) {
		const c = code.charAt(pos);
		const next = code.charAt(pos + 1);

		if (c === "/" && next === "/") {
			singleComment();
		} else
		if (c === "/" && next === "*") {
			multiComment();
		} else
		if (c === "'") {
			stringLiteral("'");
		} else
		if (c === "\"") {
			stringLiteral("\"");
		} else
		if (c === "`") {
			stringLiteral("`");
		} else {
			if (c === "i") {
				if (!maybeImport()) {
					++pos;
				}
			} else {
				++pos;
			}
		}
	}

	return [...importPaths];

	function maybeImport() {
		if (pos > 0) {
			const prev = code.charAt(pos - 1);
			if (prev !== " " && prev !== ";" && prev !== "\n" && prev !== "\t") return false;
		}

		const str = code.substring(pos, pos + 6); // "import"
		if (str !== "import") return false;

		let end = pos + 6;
		if (end === len) return false;

		const next = code.charAt(end);
		if (next !== " " && next !== "\t" && next !== "\r" && next !== "\n" && next !== "*" && next !== "{" && next !== "(") return false;
		++end;

		let quoteChar = "";
		while (end < len) {
			const c = code.charAt(end);
			if (c === "'" || c === '"') {
				quoteChar = c;
				break;
			}
			++end;
		}

		if (!quoteChar) return false;
		++end;
		const quotePos = end;
		let quoteEnd = -1;
		while (end < len) {
			const c = code.charAt(end);
			if (c === quoteChar) {
				quoteEnd = end;
				break;
			}
			++end;
		}
		if (quoteEnd === -1) return false;

		const importPath = code.substring(quotePos, quoteEnd);
		importPaths.add(importPath);

		pos = quoteEnd + 1;
	}

	function singleComment() {
		pos += 2; // skip "//"
		while (pos < len) {
			const c = code.charAt(pos);
			if (c === "\n") {
				++pos; // skip "\n"
				break;
			}
			++pos;
		}
	}

	function multiComment() {
		pos += 2; // skip "/*"
		let prev = "";
		while (pos < len) {
			const c = code.charAt(pos);
			if (c === "/" && prev === "*") {
				++pos; // skip "/"
				break;
			}
			prev = c;
			++pos;
		}
	}

	function stringLiteral(quote: string) {
		pos += 1; // skip quote
		let prev = "";
		while (pos < len) {
			const c = code.charAt(pos);
			if (c === quote && prev !== "\\") {
				++pos; // skip quote
				break;
			}
			prev = c;
			++pos;
		}
	}
}

export function dumpDependencyGraph(node: Node, indent = 0) {
	Log.log("  ".repeat(indent) + node.path);
	for (const dependency of node.dependencies) {
		dumpDependencyGraph(dependency, indent + 1);
	}
}
