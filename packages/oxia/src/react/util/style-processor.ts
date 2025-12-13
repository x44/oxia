import { existsSync, readFileSync } from "fs";
import { dirname } from "path";
import { absPath } from "../../util/fs.js";

export function processStyle(styleFilePath: string) {
	const visited = new Set<string>();
	const cssBundle: string[] = [];

	function processFile(filePath: string) {
		filePath = absPath(filePath);
		if (visited.has(filePath)) {
			return;
		}
		visited.add(filePath);

		let cssCode = readFileSync(filePath, "utf8");

		// remove comments before getImportedFiles()
		cssCode = processCssCode(filePath, cssCode);

		const importedFiles = getImportedFiles(filePath, cssCode);

		importedFiles.forEach(importedFile => {
			processFile(importedFile);
		});

		cssCode = cssCode.replace(/^\s*?@import .*$/gm, "");

		cssBundle.push(cssCode.trim());
	}

	function getImportedFiles(filePath: string, cssCode: string) {
		const importedFiles: string[] = [];
		const len = cssCode.length;
		let pos = 0;
		while (pos < len) {
			let i1 = cssCode.indexOf("@import", pos);
			if (i1 === -1) break;
			i1 += 7;
			const i2 = cssCode.indexOf(";", i1);
			if (i2 === -1) break;

			let q1 = -1;
			let q2 = -1;
			const sq = cssCode.indexOf("'", i1);
			if (sq > -1 && sq < i2) {
				q1 = sq;
				q2 = cssCode.indexOf("'", q1 + 1);
			} else {
				const dq = cssCode.indexOf('"', i1);
				if (dq > -1 && dq < i2) {
					q1 = dq;
					q2 = cssCode.indexOf('"', q1 + 1);
				}
			}

			if (q1 === -1 || q2 === -1) break;

			const moduleSpecifier = cssCode.substring(q1 + 1, q2);

			const resolvedPath = resolveImport(filePath, moduleSpecifier);

			if (!resolvedPath) {
				throw new Error(`Failed to resolve import\nImporter '${filePath}'\nImported '${moduleSpecifier}'`);
			}

			importedFiles.push(resolvedPath);

			pos = i2 + 1;
		}
		return importedFiles;
	}

	function resolveImport(filePath: string, moduleSpecifier: string) {
		if (!moduleSpecifier.endsWith(".css")) {
			moduleSpecifier += ".css";
		}
		const fileDir = dirname(filePath);
		const modulePath = absPath(fileDir, moduleSpecifier);
		if (!existsSync(modulePath)) {
			return undefined;
		}
		return modulePath;
	}

	function processCssCode(filePath: string, cssCode: string) {
		// remove comments
		cssCode = cssCode.replace(/\/\*[\s\S]*?\*\//gm, "");
		// remove blank lines
		cssCode = cssCode.replace(/^[ \t]*\r?\n/gm, "");
		return cssCode;
	}

	processFile(styleFilePath);

	return cssBundle.join("\n");
}
