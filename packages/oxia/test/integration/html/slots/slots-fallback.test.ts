import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "slots-fallback";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "should have default slot fallback text", async () => {
		const routeCode = `
		function Component() {
			return <slot>FALLBACK</slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `FALLBACK`;
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
	test(`${testId} ` + "should have default slot fallback div", async () => {
		const routeCode = `
		function Component() {
			return <slot><div>FALLBACK</div></slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>FALLBACK</div>`;
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
	test(`${testId} ` + "should have default slot fallback 2 nested divs", async () => {
		const routeCode = `
		function Component() {
			return <slot><div><div>FALLBACK</div></div></slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div><div>FALLBACK</div></div>`;
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
	test(`${testId} ` + "should have default slot fallback 2 divs", async () => {
		const routeCode = `
		function Component() {
			return <slot><div>FALLBACK1</div><div>FALLBACK2</div></slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>FALLBACK1</div><div>FALLBACK2</div>`;
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
	test(`${testId} ` + "should have default slot fallback component", async () => {
		const routeCode = `
		function Fallback() {
			return <div>FALLBACKCOMPONENT</div>
		}
		function Component() {
			return <slot><Fallback/></slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>FALLBACKCOMPONENT</div>`;
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
	test(`${testId} ` + "should have default slot fallback component with slot", async () => {
		const routeCode = `
		function Fallback() {
			return <slot/>
		}
		function Component() {
			return <slot><Fallback><div>FALLBACKCOMPONENT</div></Fallback></slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>FALLBACKCOMPONENT</div>`;
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
	test(`${testId} ` + "should have default slot fallback and other slot fallback", async () => {
		const routeCode = `
		function Component() {
			return <slot>DefaultSlotFallback</slot><slot name="other">OtherSlotFallback</slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `DefaultSlotFallbackOtherSlotFallback`;
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
	test(`${testId} ` + "should have default slot fallback and other slot content", async () => {
		const routeCode = `
		function Component() {
			return <slot>DefaultSlotFallback</slot><slot name="other">OtherSlotFallback</slot>
		}
		export default function Index() {
			return <Component><div slot="other">OtherSlotContent</div></Component>
		}
		`;

		const expected = `DefaultSlotFallback<div>OtherSlotContent</div>`;
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
	test(`${testId} ` + "should have default slot content and other slot fallback", async () => {
		const routeCode = `
		function Component() {
			return <slot>DefaultSlotFallback</slot><slot name="other">OtherSlotFallback</slot>
		}
		export default function Index() {
			return <Component><div>DefaultSlotContent</div></Component>
		}
		`;

		const expected = `<div>DefaultSlotContent</div>OtherSlotFallback`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});