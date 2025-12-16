import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as ts from "typescript";

const isWin = os.platform() === "win32";

export function resolveSpecifier(specifier: string, parentUrl: string | undefined) {
	let absFile = specifier2file(specifier);
	let absParentFile = parentUrl !== undefined ? url2file(parentUrl) : undefined;
	if (!path.isAbsolute(absFile) && absParentFile) {
		const parentDir = path.dirname(absParentFile);
		absFile = path.resolve(parentDir, absFile);
	}
	if (fs.existsSync(absFile)) return absFile.replaceAll("\\", "/");

	if (absFile.endsWith(".js")) {
		return checkFileWithExtension(absFile, ".ts", absParentFile);
	}
	if (absFile.endsWith(".ts")) {
		return checkFileWithExtension(absFile, ".js", absParentFile);
	}

	return undefined;
}

function checkFileWithExtension(absFile: string, newExt: string, absParentFile: string | undefined) {
	absFile = withExtension(absFile, newExt).replaceAll("\\", "/");
	if (absFile === absParentFile) return undefined;
	if (!fs.existsSync(absFile)) return undefined;
	return absFile;
}

export function toUrl(absFile: string, timestamp: number | undefined) {
	const absUrl = `file://${absFile.startsWith("/") ? "" : "/"}${absFile.replaceAll("\\", "/")}`;

	if (timestamp !== undefined) {
		return appendTimestamp(absUrl, timestamp);
	}
	return absUrl;
}

function appendTimestamp(url: string, timestamp: number) {
	return `${url}?t=${timestamp}`;
}

export function isProjectFile(absProjectSrcDir: string | undefined, absFile: string | undefined) {
	if (!absProjectSrcDir || !absFile) return false;
	return absFile.startsWith(absProjectSrcDir);
}

export function specifier2file(specifier: string) {
	return specifier.startsWith("file:///")
		? url2file(specifier)
		: specifier;
}

export function url2file(url: string) {
	const t = url.lastIndexOf("?t=");
	return url.substring("file://".length + (isWin ? 1 : 0), t === -1 ? url.length : t);
}

export function withExtension(urlOrPath: string, extension: string) {
	return `${urlOrPath.substring(0, urlOrPath.lastIndexOf("."))}${extension}`;
}

export function transpileToJs(tsOrTsxCode: string) {
	const result = ts.transpileModule(tsOrTsxCode, {
		compilerOptions: {
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ESNext,
			esModuleInterop: true,
			strict: true,
			jsx: ts.JsxEmit.React,
		}
	});
	return result.outputText;
}
