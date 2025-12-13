import { createRouteFile, type RouteFile } from "../../../../src/build/file/file.js";
import { defaultOptions, resolveOptions } from "../../../../src/build/options/options.js";
import { absPath } from "../../../../src/util/fs.js";

const ROUTES = "routes";
const ROOT = absPath("");

describe("route file module", () => {
	test("index route, default paths, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,

			route: ``,
			routePath: `/`,
			routeName: `index`,

			htmlAbsPath: `${ROOT}/dist/index.html`,
		};

		expect(actual).toEqual(expected);
	});

	test("index route, custom root, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,

			route: ``,
			routePath: `/`,
			routeName: `index`,

			htmlAbsPath: `${ROOT}/sub/dist/index.html`,
		};

		expect(actual).toEqual(expected);
	});


	// ABOUT ROUTE IN ROOT
	test("about route in root, default paths, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `about`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `about.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/about.oxia`,
			oxiaRelPath: `${ROUTES}/about.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});

	test("about route in root, custom root, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `about`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `about.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/about.oxia`,
			oxiaRelPath: `${ROUTES}/about.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/sub/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});


	// ABOUT ROUTE IN SUBDIR
	test("about route in sub dir, default paths, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/about/index.oxia`,
			oxiaRelPath: `${ROUTES}/about/index.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});

	test("about route in sub dir, custom root, relative oxiaPath", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/about/index.oxia`,
			oxiaRelPath: `${ROUTES}/about/index.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/sub/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});


	////////////////////////////////////////////////////////////////////////////////
	// WITH TIMESTAMP

	test("index route, default paths, relative oxiaPath with timestamp", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,

			route: ``,
			routePath: `/`,
			routeName: `index`,

			htmlAbsPath: `${ROOT}/dist/index.html`,
		};

		expect(actual).toEqual(expected);
	});

	test("index route, custom root, relative oxiaPath with timestamp", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/index.oxia`,
			oxiaRelPath: `${ROUTES}/index.oxia`,

			route: ``,
			routePath: `/`,
			routeName: `index`,

			htmlAbsPath: `${ROOT}/sub/dist/index.html`,
		};

		expect(actual).toEqual(expected);
	});


	// ABOUT ROUTE IN ROOT
	test("about route in root, default paths, relative oxiaPath with timestamp", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `about`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `about.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/about.oxia`,
			oxiaRelPath: `${ROUTES}/about.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});

	test("about route in root, custom root, relative oxiaPath with timestamp", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `about`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `about.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/about.oxia`,
			oxiaRelPath: `${ROUTES}/about.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/sub/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});


	// ABOUT ROUTE IN SUBDIR
	test("about route in sub dir, default paths, relative oxiaPath with timestamp", () => {
		const defOptions = defaultOptions();
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/src/${ROUTES}/about/index.oxia`,
			oxiaRelPath: `${ROUTES}/about/index.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});

	test("about route in sub dir, custom root, relative oxiaPath with timestamp", () => {
		const defOptions = defaultOptions();
		defOptions.paths.root = "sub";
		const options = resolveOptions("dev", defOptions);

		const oxiaPath = `${ROUTES}/about/index.oxia`;
		const actual = createRouteFile(options, oxiaPath);
		const expected: RouteFile = {
			name: `index`,
			oxiaFilePath: oxiaPath,
			oxiaFileName: `index.oxia`,
			oxiaAbsPath: `${ROOT}/sub/src/${ROUTES}/about/index.oxia`,
			oxiaRelPath: `${ROUTES}/about/index.oxia`,

			route: `about`,
			routePath: `/about`,
			routeName: `about`,

			htmlAbsPath: `${ROOT}/sub/dist/about/index.html`,
		};

		expect(actual).toEqual(expected);
	});

});