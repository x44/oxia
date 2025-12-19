import { parseImportsFromCode } from "../../../../src/build/dependencies/dependency-parser.js";

describe("dependency parser", () => {
	test("should return no imports from empty code", () => {
		const actual = parseImportsFromCode(``);
		const expected: string[] = [];
		expect(actual).toEqual(expected);
	});

	test("should return no imports from single commented code", () => {
		const actual = parseImportsFromCode(`// import x from "a.b"`);
		const expected: string[] = [];
		expect(actual).toEqual(expected);
	});

	test("should return no imports from multi commented code", () => {
		const actual = parseImportsFromCode(`/* import x from "a.b" */`);
		const expected: string[] = [];
		expect(actual).toEqual(expected);
	});

	test("should return one import with double quotes", () => {
		const actual = parseImportsFromCode(`import x from "a.b"`);
		const expected: string[] = ["a.b"];
		expect(actual).toEqual(expected);
	});

	test("should return one import with single quotes", () => {
		const actual = parseImportsFromCode(`import x from 'a.b'`);
		const expected: string[] = ["a.b"];
		expect(actual).toEqual(expected);
	});

	test("should return two imports", () => {
		const actual = parseImportsFromCode(`
			import x from "a.b"
			import y from 'c.d'
		`);
		const expected: string[] = ["a.b", "c.d"];
		expect(actual).toEqual(expected);
	});

	test("should return two unique imports only", () => {
		const actual = parseImportsFromCode(`
			import x from "a.b"
			import y from "a.b"
			import "a.b"
			import x from "c.d"
			import y from "c.d"
			import "c.d"
		`);
		const expected: string[] = ["a.b", "c.d"];
		expect(actual).toEqual(expected);
	});

	test("should return no imports from strings", () => {
		const actual = parseImportsFromCode(`
			import x from "a.b"
			const s = "import 'c.d'"
			const s = 'import "c.d"'
			const s = \`import "c.d"\`
		`);
		const expected: string[] = ["a.b"];
		expect(actual).toEqual(expected);
	});

	test("should handle dynamic imports", () => {
		const actual = parseImportsFromCode(`
			const i = import("a.b")
			const i = import( "c.d")
			const i = import ( "e.f" )
		`);
		const expected: string[] = ["a.b", "c.d", "e.f"];
		expect(actual).toEqual(expected);
	});

	test("should handle exotic imports", () => {
		const actual = parseImportsFromCode(`
			import* from "a.b"
			import{x} from "c.d"
			import
			{ x } from
			"e.f"
		`);
		const expected: string[] = ["a.b", "c.d", "e.f"];
		expect(actual).toEqual(expected);
	});

	test("should not import", () => {
		const actual = parseImportsFromCode(`
			ximport from "a.b"
			importx from "a.b"
			myimport("a.b")
		`);
		const expected: string[] = [];
		expect(actual).toEqual(expected);
	});
});