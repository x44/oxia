import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "fragments";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test.only(`${testId} ` + "should be one fragment", async () => {
		const routeCode = `
		export default function Index() {
			return <div></div>
		}
		`;

		const expected = `<fragment><div></div></fragment>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode}, undefined, undefined, (options) => {
			options.build.keepFragments = true;
		});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

{
	const testId = getTestId();
	test.only(`${testId} ` + "should be one fragment in another fragment (1)", async () => {
		const routeCode = `
		function Component() {
			return <div></div>
		}
		export default function Index() {
			return <Component/>
		}
		`;

		const expected = `<fragment><fragment><div></div></fragment></fragment>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode}, undefined, undefined, (options) => {
			options.build.keepFragments = true;
		});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

{
	const testId = getTestId();
	test.only(`${testId} ` + "should be one fragment in another fragment (2)", async () => {
		const routeCode = `
		function Component() {
			return <><div></div></>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<fragment><fragment><div></div></fragment></fragment>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode}, undefined, undefined, (options) => {
			options.build.keepFragments = true;
		});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

{
	const testId = getTestId();
	test.only(`${testId} ` + "should be one fragment in another fragment (3)", async () => {
		const routeCode = `
		function Component() {
			return <><div></div></>
		}
		export default function Index() {
			return <><Component></Component></>
		}
		`;

		const expected = `<fragment><fragment><div></div></fragment></fragment>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode}, undefined, undefined, (options) => {
			options.build.keepFragments = true;
		});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

{
	const testId = getTestId();
	test.only(`${testId} ` + "should be one fragment in another fragment in another fragment (1)", async () => {
		const routeCode = `
		function Child() {
			return <div></div>
		}
		function Component() {
			return <Child/>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<fragment><fragment><fragment><div></div></fragment></fragment></fragment>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode}, undefined, undefined, (options) => {
			options.build.keepFragments = true;
		});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});