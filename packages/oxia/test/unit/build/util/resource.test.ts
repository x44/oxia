import { toResourceFileAndReference } from "../../../../src/util/resource.js";

describe("resource module", () => {
	test("index route, relative destination, no sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/test.js");
		expect(result.ref).toBe("/test.js");
	});
	test("index route, relative destination, no sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/test.js");
		expect(result.ref).toBe("test.js");
	});
	test("index route, relative destination, with sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "scripts/test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/scripts/test.js");
		expect(result.ref).toBe("/scripts/test.js");
	});
	test("index route, relative destination, with sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "scripts/test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/scripts/test.js");
		expect(result.ref).toBe("scripts/test.js");
	});

	test("about route, relative destination, no sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/about/test.js");
		expect(result.ref).toBe("/about/test.js");
	});
	test("about route, relative destination, no sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/about/test.js");
		expect(result.ref).toBe("test.js");
	});
	test("about route, relative destination, with sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "scripts/test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/about/scripts/test.js");
		expect(result.ref).toBe("/about/scripts/test.js");
	});
	test("about route, relative destination, with sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "scripts/test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/about/scripts/test.js");
		expect(result.ref).toBe("scripts/test.js");
	});


	test("index route, absolute destination, no sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "/test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/test.js");
		expect(result.ref).toBe("/test.js");
	});
	test("index route, absolute destination, no sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "/test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/test.js");
		expect(result.ref).toBe("test.js");
	});
	test("index route, absolute destination, with sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "/scripts/test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/scripts/test.js");
		expect(result.ref).toBe("/scripts/test.js");
	});
	test("index route, absolute destination, with sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist", "/scripts/test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/scripts/test.js");
		expect(result.ref).toBe("scripts/test.js");
	});

	test("about route, absolute destination, no sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "/test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/test.js");
		expect(result.ref).toBe("/test.js");
	});
	test("about route, absolute destination, no sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "/test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/test.js");
		expect(result.ref).toBe("../test.js");
	});
	test("about route, absolute destination, with sub destinaton, absolute reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "/scripts/test.js", "abs");
		expect(result.absDstFilePath).toBe("X:/dist/scripts/test.js");
		expect(result.ref).toBe("/scripts/test.js");
	});
	test("about route, absolute destination, with sub destinaton, relative reference", () => {
		const result = toResourceFileAndReference("X:/dist", "X:/dist/about", "/scripts/test.js", "rel");
		expect(result.absDstFilePath).toBe("X:/dist/scripts/test.js");
		expect(result.ref).toBe("../scripts/test.js");
	});
});