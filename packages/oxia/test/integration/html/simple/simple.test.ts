import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "simple";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "no frag", async () => {
		const routeCode = `
		export default function Index() {
			return <div>Index</div><div>Index</div>
		}
		`;

		const expected = `<div>Index</div><div>Index</div>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

{
	const testId = getTestId();
	test(`${testId} ` + "with frag", async () => {
		const routeCode = `
		export default function Index() {
			return <><div>Index</div><div>Index</div></>
		}
		`;

		const expected = `<div>Index</div><div>Index</div>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});