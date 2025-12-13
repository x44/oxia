import { existsSync, readFileSync } from "fs";
import { dirname } from "path";
import * as ts from "typescript";
import { absPath } from "../../util/fs.js";

export function processScript(scriptFilePath: string) {
	const visited = new Set<string>();
	const jsBundle: string[] = [];

	function processFile(filePath: string) {
		filePath = absPath(filePath);
		if (visited.has(filePath)) {
			return;
		}
		visited.add(filePath);

		const tsCode = readFileSync(filePath, "utf8");

		const sourceFile = ts.createSourceFile(
			filePath,
			tsCode,
			ts.ScriptTarget.Latest,
			true
		);

		// const imports: { modulePath: string; names: string[]; }[] = [];

		ts.forEachChild(sourceFile, node => {
			if (ts.isImportDeclaration(node)) {
				const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
				const resolvedPath = resolveImport(filePath, moduleSpecifier);

				if (!resolvedPath) {
					throw new Error(`Failed to resolve import\nImporter '${filePath}'\nImported '${moduleSpecifier}'`);
				}

				const names: string[] = [];
				if (node.importClause?.namedBindings) {
					if (ts.isNamedImports(node.importClause.namedBindings)) {
						node.importClause.namedBindings.elements.forEach(element => {
							names.push(element.name.text);
						});
					}
				}

				// debug("found import", resolvedPath, names);
				// imports.push({ modulePath: resolvedPath, names });

				processFile(resolvedPath);
			}
		});

		let jsCode = transpileTypeScript(filePath, tsCode);

		jsCode = jsCode.replace(/^\s*?import .*$/gm, "");
		jsCode = jsCode.replace(/^\s*?export /gm, "");

		jsBundle.push(jsCode.trim());
	}

	function resolveImport(filePath: string, moduleSpecifier: string) {
		if (!moduleSpecifier.endsWith(".ts")) {
			moduleSpecifier += ".ts";
		}
		const fileDir = dirname(filePath);
		const modulePath = absPath(fileDir, moduleSpecifier);
		if (!existsSync(modulePath)) {
			return undefined;
		}
		return modulePath;
	}

	function transpileTypeScript(filePath: string, tsCode: string) {
		const result = ts.transpileModule(tsCode, {
			compilerOptions: {
				module: ts.ModuleKind.Preserve,
				target: ts.ScriptTarget.ESNext,
				strict: false,
				removeComments: true,
			}
		});
		const jsCode = result.outputText;
		return jsCode;
	}

	processFile(scriptFilePath);

	return jsBundle.join("\n");
}
