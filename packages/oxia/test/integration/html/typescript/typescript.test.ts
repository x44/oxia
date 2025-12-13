import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "typescript";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "invoking an imported typescript function", async () => {
		const routeCode = `
		import { utilFunction, Enum } from "../utils/util.js";
		export default function Index() {
			return <div>{utilFunction("Index", Enum.ONE)}</div>
		}
		`;

		const utilCode = `
		export enum Enum {
			ONE = "One",
			TWO = "Two"
		}

		export function utilFunction(s: string, e: Enum) {
			return "You passed '" + s + "' and e is '" + e + "'";
		}
		`;

		const expected = `<div>You passed 'Index' and e is 'One'</div>`;

		const actual = await runOxia2Html(ID, testId,
			{path: "index", code: routeCode},
			[],
			[{path: "util", code: utilCode}]
		);

		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});