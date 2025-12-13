import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "slots-filled";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "should be one empty div", async () => {
		const routeCode = `
		function Component() {
			return <div><slot></slot></div>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div></div>`;
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
	test(`${testId} ` + "should be empty", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled:default><slot></slot></div>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = ``;
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
	test(`${testId} ` + "should be one div with ifSlotEmptyDefault", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled:default><slot></slot></div>
			       <div ifSlotEmpty:default>ifSlotEmptyDefault</div>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>ifSlotEmptyDefault</div>`;
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
	test(`${testId} ` + "should be one div with ifSlotFilledDefault and one div with Content", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled:default>ifSlotFilledDefault</div>
			       <div ifSlotEmpty:default>ifSlotEmptyDefault</div>
				   <slot></slot>
		}
		export default function Index() {
			return <Component><div>Content</div></Component>
		}
		`;

		const expected = `<div>ifSlotFilledDefault</div><div>Content</div>`;
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
	test(`${testId} ` + "should be one div with ifSlotEmptyDefault", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled:default>ifSlotFilledDefault</div>
			       <div ifSlotEmpty:default>ifSlotEmptyDefault</div>
				   <slot></slot>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>ifSlotEmptyDefault</div>`;
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
	test(`${testId} ` + "should be one div with Content inside other div", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled:default>Content:<div><slot></slot></div></div>
		}
		export default function Index() {
			return <Component>Content</Component>
		}
		`;

		const expected = `<div>Content:<div>Content</div></div>`;
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
	test(`${testId} ` + "should be one div with div ContentDefault and one div with div ContentOther", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled:default><slot></slot></div>
			       <div ifSlotFilled:other><slot name="other"></slot></div>
		}
		export default function Index() {
			return <Component><div>ContentDefault</div><div slot="other">ContentOther</div></Component>
		}
		`;

		const expected = `<div><div>ContentDefault</div></div><div><div>ContentOther</div></div>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});