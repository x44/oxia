import { DependencyRegistry } from "../../../src/build/dependencies/dependency-registry.js";
import { createRouteFile, type RouteFile } from "../../../src/build/file/file.js";
import { defaultOptions, resolveOptions } from "../../../src/build/options/options.js";
import { tsx2html } from "../../../src/build/tsx2html/index.js";
import type { ResolvedOptions } from "../../../src/config/types.js";
import { absPath, writeTextFile } from "../../../src/util/fs.js";
import { TMP_ROOT } from "../../setup.js";

type SuiteProps = {
	root: string;
	srcDir: string;
}

function createSuiteProps(suiteId: string, testId: string): SuiteProps {
	const testIdStr = testId.toString().padStart(3, "0");
	return  {
		root: absPath(`${TMP_ROOT}/${suiteId}/${testIdStr}`),
		srcDir: absPath(`${TMP_ROOT}/${suiteId}/${testIdStr}/src`),
	};
}

let nextTestId = 0;
export function getTestId() {
	return (nextTestId++).toString().padStart(3, "0");
}

function createSuiteOptions(suiteId: string, testId: string) {
	const props = createSuiteProps(suiteId, testId);
	const defOptions = defaultOptions();
	// defOptions.start.debug = true;
	defOptions.paths.root = props.root;
	const options = resolveOptions("dev", defOptions);
	return options;
}

function writeSourceFile(suiteId: string, testId: string, filePath: string, code: string): RouteFile {
	const props = createSuiteProps(suiteId, testId);
	code = leftAlign(code);

	const oxiaFilePath = absPath(props.srcDir, filePath);
	writeTextFile(oxiaFilePath, code);

	const options = createSuiteOptions(suiteId, testId);
	const file = createRouteFile(options, oxiaFilePath);
	return file;
}

export async function runOxia2Html(suiteId: string, testId: string, route: {path: string, code: string}, components?: {path: string, code: string}[], utils?: {path: string, code: string}[], optionsHandler?: (options: ResolvedOptions) => void) {
	const options = createSuiteOptions(suiteId, testId);

	if (optionsHandler) optionsHandler(options);

	const routeFile = writeSourceFile(suiteId, testId, `routes/${route.path}.oxia`, route.code);

	DependencyRegistry.addRoute(routeFile.oxiaAbsPath);

	if (components) {
		for (const component of components) {
			writeSourceFile(suiteId, testId, `components/${component.path}.oxia`, component.code);
		}
	}

	if (utils) {
		for (const util of utils) {
			writeSourceFile(suiteId, testId, `utils/${util.path}.ts`, util.code);
		}
	}

	let html = await tsx2html(options, routeFile);

	writeTextFile(routeFile.htmlAbsPath, html);
	return html;
}

function leftAlign(code: string) {
	function countTabs(s: string) {
		let n = 0;
		let p = 0;
		while (p < s.length) {
			const c = s.charAt(p++);
			if (c === "\t") ++n;
			else break;
		}
		return n;
	}

	let a = code.split("\n");
	let begin = true;
	let minTabs = Number.POSITIVE_INFINITY;
	a = a.filter(line => {
		if (begin && line.length === 0) return false;
		begin = false;
		if (line.length) {
			minTabs = Math.min(minTabs, countTabs(line));
		}
		return true;
	});
	if (minTabs > 0 && minTabs < Number.POSITIVE_INFINITY) a = a.map(line => line.substring(minTabs));
	code = a.join("\n");
	return code;
}