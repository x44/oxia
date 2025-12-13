import { createBuildFile } from "../../../src/build/file/file.js";
import { defaultOptions, resolveOptions } from "../../../src/build/options/options.js";
import { oxia2tsx } from "../../../src/build/oxia2tsx/index.js";
import { FUNCTION_ID_END_TAG, FUNCTION_ID_START_TAG, SET_STYLE_RESULT_FUNCTION, STYLE_ID_END_TAG, STYLE_ID_START_TAG } from "../../../src/build/oxia2tsx/types.js";

type TestOxia2TsxStats = {
	lineCount: number;
	functionCount: number;
	functionIdCount: number;
	styleCount: number;
	styleIdCount: number;
}

export function testOxia2TsxStats(actual: string, expected: string): { statsActual: TestOxia2TsxStats, statsExpected: TestOxia2TsxStats } {
	actual = trimLines(actual);
	expected = trimLines(expected);
	return {
		statsActual: {
			lineCount: getLineCount(actual),
			functionCount: getFunctionCount(actual),
			functionIdCount: getFunctionIdCount(actual),
			styleCount: getStyleCount(actual),
			styleIdCount: getStyleIdCount(actual),
		},
		statsExpected: {
			lineCount: getLineCount(expected),
			functionCount: getFunctionCount(expected),
			functionIdCount: getFunctionIdCount(expected),
			styleCount: getStyleCount(expected),
			styleIdCount: getStyleIdCount(expected),
		}
	};
}

function getLineCount(s: string) {
	return s.length === 0 ? 0 : s.split("\n").length;
}

function getFunctionCount(s: string) {
	return s.split("\n").filter(line => line.includes("function")).length;
}

function getFunctionIdCount(s: string) {
	return s.split("\n").filter(line => line.includes(FUNCTION_ID_START_TAG) && line.includes(FUNCTION_ID_END_TAG)).length;
}

function getStyleCount(s: string) {
	return s.split("\n").filter(line => line.includes("<style")).length;
}

function getStyleIdCount(s: string) {
	return s.split("\n").filter(line => line.includes(STYLE_ID_START_TAG) && line.includes(STYLE_ID_END_TAG)).length;
}

export function runOxia2Tsx(srcCode: string) {
	const defOptions = defaultOptions();
	defOptions.main.debug = true;
	const options = resolveOptions("dev", defOptions);

	const file = createBuildFile(options, "dummy.oxia");

	const dstCode = oxia2tsx(file.oxiaAbsPath, srcCode);

	return trimLines(dstCode);
}

export function testOxia2TsxRemoveActualIds(srcCode: string) {
	const functionIdRegExp = new RegExp(`const __FID__ = "${FUNCTION_ID_START_TAG}.*?${FUNCTION_ID_END_TAG}";`, "gm");
	srcCode = srcCode.replace(functionIdRegExp, `${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}`);

	const styleIdRegExp = new RegExp(`${STYLE_ID_START_TAG}.*?${STYLE_ID_END_TAG}`, "gm");
	srcCode = srcCode.replace(styleIdRegExp, `${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}`);

	const setStyleResultRegExp = new RegExp(`${SET_STYLE_RESULT_FUNCTION}\\(".*?",`, "gm");
	srcCode = srcCode.replace(setStyleResultRegExp, `${SET_STYLE_RESULT_FUNCTION}("",`);

	return trimLines(srcCode);
}

export function trimLines(src: string) {
	const a = src.split("\n");
	for (let i = 0; i < a.length; ++i) {
		a[i] = a[i].trim();
	}
	return a.join("\n");
}