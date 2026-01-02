import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "slots-selfslotting";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "should be empty - no slot given", async () => {
		const routeCode = `
		function Parent() {
			return (
				<slot name="child"/>
			)
		}
		function Child() {
			return (
				<div>Child</div>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child></Child>
				</Parent>
			)
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
	test(`${testId} ` + "should be slotted - slot given by user", async () => {
		const routeCode = `
		function Parent() {
			return (
				<slot name="child"/>
			)
		}
		function Child() {
			return (
				<div>Child</div>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child slot="child"></Child>
				</Parent>
			)
		}
		`;

		const expected = `<div>Child</div>`;
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
	test(`${testId} ` + "should be slotted - slot given by child", async () => {
		const routeCode = `
		function Parent() {
			return (
				<slot name="child"/>
			)
		}
		function Child() {
			return (
				<div slot="child">Child</div>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child></Child>
				</Parent>
			)
		}
		`;

		const expected = `<div>Child</div>`;
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
	test(`${testId} ` + "should be empty - slot given by child not exists", async () => {
		const routeCode = `
		function Parent() {
			return (
				<slot name="child"/>
			)
		}
		function Child() {
			return (
				<div slot="this_slot_not_exists">Child</div>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child></Child>
				</Parent>
			)
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
	test(`${testId} ` + "should be slotted - slot given by child not exists, but slot given by user overrules", async () => {
		const routeCode = `
		function Parent() {
			return (
				<slot name="child"/>
			)
		}
		function Child() {
			return (
				<div slot="this_slot_not_exists">Child</div>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child slot="child"></Child>
				</Parent>
			)
		}
		`;

		const expected = `<div>Child</div>`;
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
	test(`${testId} ` + "should be slotted - multiple child elements wrapped in a div", async () => {
		const routeCode = `
		function Parent() {
			return (
				<slot name="child"/>
			)
		}
		function Child() {
			return (
				<div slot="child">
					<div>ChildA</div>
					<div>ChildB</div>
				</div>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child></Child>
				</Parent>
			)
		}
		`;

		const expected = `<div><div>ChildA</div><div>ChildB</div></div>`;
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
	test(`${testId} ` + "should be slotted - multiple child elements wrapped in a fragment", async () => {
		const routeCode = `
		function Parent() {
			return (
				<slot name="child"/>
			)
		}
		function Child() {
			return (
				<fragment slot="child">
					<div>ChildA</div>
					<div>ChildB</div>
				</fragment>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child></Child>
				</Parent>
			)
		}
		`;

		const expected = `<div>ChildA</div><div>ChildB</div>`;
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
	test(`${testId} ` + "should be slotted - child elements in different slots", async () => {
		const routeCode = `
		function Parent() {
			return (
				<div>
					<slot name="child_a"/>
				</div>
				<div>
					<slot name="child_b"/>
				</div>
			)
		}
		function Child() {
			return (
				<div slot="child_a">ChildA</div>
				<div slot="child_b">ChildB</div>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child></Child>
				</Parent>
			)
		}
		`;

		const expected = `<div><div>ChildA</div></div><div><div>ChildB</div></div>`;
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
	test(`${testId} ` + "should be slotted - child elements in different slots using fragments", async () => {
		const routeCode = `
		function Parent() {
			return (
				<div>
					<slot name="child_a"/>
				</div>
				<div>
					<slot name="child_b"/>
				</div>
			)
		}
		function Child() {
			return (
				<fragment slot="child_a">
					<div>ChildA</div>
				</fragment>
				<fragment slot="child_b">
					<div>ChildB</div>
				</fragment>
			)
		}
		export default function Index() {
			return (
				<Parent>
					<Child></Child>
				</Parent>
			)
		}
		`;

		const expected = `<div><div>ChildA</div></div><div><div>ChildB</div></div>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});