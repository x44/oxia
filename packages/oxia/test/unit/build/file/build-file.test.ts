import { createBuildFile, type BuildFile } from "../../../../src/build/file/file.js";
import { defaultOptions, resolveOptions } from "../../../../src/build/options/options.js";
import { absPath } from "../../../../src/util/fs.js";

const ROUTES = "routes";
const ROOT = absPath("");

describe("build file module", () => {
	test("default paths, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});

	test("default paths, absolute oxiaPath", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROOT}/src/${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});

	test("custom root, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});

	test("custom root, absolute oxiaPath", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROOT}/sub/src/${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});


	// TIMESTAMP

	test("default paths, relative oxiaPath, with timestamp", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});

	test("default paths, absolute oxiaPath, with timestamp", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROOT}/src/${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});

	test("custom root, relative oxiaPath, with timestamp", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});

	test("custom root, absolute oxiaPath, with timestamp", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROOT}/sub/src/${ROUTES}/index.oxia`;
		const actual = createBuildFile(options, oxiaPath);
		const expected: BuildFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,
		};

		expect(actual).toEqual(expected);
	});

});