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
	test(`${testId} ` + "should be empty (no slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled><slot></slot></div>
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
	test(`${testId} ` + "should be empty (empty slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled=""><slot></slot></div>
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
	test(`${testId} ` + "should be empty (default slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled="default"><slot></slot></div>
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
	test(`${testId} ` + "should be one div with 'Empty' (no slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled><slot></slot></div>
			       <div ifSlotEmpty>Empty</div>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>Empty</div>`;
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
	test(`${testId} ` + "should be one div with 'Empty' (empty slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled=""><slot></slot></div>
			       <div ifSlotEmpty="">Empty</div>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>Empty</div>`;
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
	test(`${testId} ` + "should be one div with 'Empty' (default slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled="default"><slot></slot></div>
			       <div ifSlotEmpty="default">Empty</div>
		}
		export default function Index() {
			return <Component></Component>
		}
		`;

		const expected = `<div>Empty</div>`;
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
	test(`${testId} ` + "should be one div with 'Default' and one with 'Content' (no slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled>Default</div>
			       <div ifSlotEmpty>Empty</div>
				   <slot></slot>
		}
		export default function Index() {
			return <Component><div>Content</div></Component>
		}
		`;

		const expected = `<div>Default</div><div>Content</div>`;
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
	test(`${testId} ` + "should be one div with 'Default' and one with 'Content' (empty slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled="">Default</div>
			       <div ifSlotEmpty="">Empty</div>
				   <slot></slot>
		}
		export default function Index() {
			return <Component><div>Content</div></Component>
		}
		`;

		const expected = `<div>Default</div><div>Content</div>`;
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
	test(`${testId} ` + "should be one div with 'Default' and one with 'Content' (default slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled="default">Default</div>
			       <div ifSlotEmpty="default">Empty</div>
				   <slot></slot>
		}
		export default function Index() {
			return <Component><div>Content</div></Component>
		}
		`;

		const expected = `<div>Default</div><div>Content</div>`;
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
	test(`${testId} ` + "should be one div with 'Content' inside other div (no slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled>Content:<div><slot></slot></div></div>
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
	test(`${testId} ` + "should be one div with 'Content' inside other div (empty slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled="">Content:<div><slot></slot></div></div>
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
	test(`${testId} ` + "should be one div with 'Content' inside other div (default slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled="default">Content:<div><slot></slot></div></div>
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
	test(`${testId} ` + "should be one div with div 'ContentDefault' and one div with div 'ContentOther' (no slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled><slot></slot></div>
			       <div ifSlotFilled="other"><slot name="other"></slot></div>
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

{
	const testId = getTestId();
	test(`${testId} ` + "should be one div with div 'ContentDefault' and one div with div 'ContentOther' (empty slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled=""><slot></slot></div>
			       <div ifSlotFilled="other"><slot name="other"></slot></div>
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

{
	const testId = getTestId();
	test(`${testId} ` + "should be one div with div 'ContentDefault' and one div with div 'ContentOther' (default slotname)", async () => {
		const routeCode = `
		function Component() {
			return <div ifSlotFilled="default"><slot></slot></div>
			       <div ifSlotFilled="other"><slot name="other"></slot></div>
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