import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "styles-slots";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "should be div data-oxia-sid-a", async () => {
		const routeCode = `
		function Component() {
			return <slot/>
		}
		export default function Index() {
			return <Component><div>Child</div></Component>
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-a>Child</div>`;
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
	test(`${testId} ` + "should be div data-oxia-sid-b", async () => {
		const routeCode = `
		function Component() {
			return <slot/>
			<style></style>
		}
		export default function Index() {
			return <Component><div>Child</div></Component>
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-b>Child</div>`;
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
	test(`${testId} ` + "should be div data-oxia-sid-a with inner div data-oxia-sid-b", async () => {
		const routeCode = `
		function Component() {
			return <slot/>
			<style></style>
		}
		export default function Index() {
			return <div><Component><div>Child</div></Component></div>
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-a><div data-oxia-sid-b>Child</div></div>`;
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
	test(`${testId} ` + "should be div data-oxia-sid-a with inner div data-oxia-sid-b (no slotname)", async () => {
		const routeCode = `
		function Component() {
			return <slot/>
			<style></style>
			<style slot></style>
		}
		export default function Index() {
			return <div><Component><div>Child</div></Component></div>
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-a><div data-oxia-sid-b>Child</div></div>`;
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
	test(`${testId} ` + "should be div data-oxia-sid-a with inner div data-oxia-sid-b (empty slotname)", async () => {
		const routeCode = `
		function Component() {
			return <slot/>
			<style></style>
			<style slot=""></style>
		}
		export default function Index() {
			return <div><Component><div>Child</div></Component></div>
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-a><div data-oxia-sid-b>Child</div></div>`;
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
	test(`${testId} ` + "should be div data-oxia-sid-a with inner div data-oxia-sid-b (default slotname)", async () => {
		const routeCode = `
		function Component() {
			return <slot/>
			<style></style>
			<style slot="default"></style>
		}
		export default function Index() {
			return <div><Component><div>Child</div></Component></div>
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-a><div data-oxia-sid-b>Child</div></div>`;
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
	test(`${testId} ` + "should be div data-oxia-sid-a with inner div data-oxia-sid-b", async () => {
		const routeCode = `
		function Component() {
			return <slot/><slot name="other"/>
			<style></style>
			<style slot="default"></style>
			<style slot="other"></style>
		}
		export default function Index() {
			return <div><Component><div>Child</div></Component></div>
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-a><div data-oxia-sid-b>Child</div></div>`;
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
	test(`${testId} ` + "should be div data-oxia-sid-a with inner div data-oxia-sid-b and div data-oxia-sid-c", async () => {
		const routeCode = `
		function Component() {
			return (
				<slot/>
				<slot name="other"/>
			)
			<style></style>
			<style slot="default"></style>
			<style slot="other"></style>
		}
		export default function Index() {
			return (
				<div>
					<Component><div>ChildInDefaultSlot</div></Component>
					<Component><div slot="other">ChildInOtherSlot</div></Component>
				</div>
			)
		}
		<style></style>
		`;

		const expected = `<div data-oxia-sid-a><div data-oxia-sid-b>ChildInDefaultSlot</div><div data-oxia-sid-c>ChildInOtherSlot</div></div>`;
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
	test(`${testId} ` + "must not produce exception due to empty styles", async () => {
		const routeCode = `
		function Component() {
			return (
				<slot/>
				<slot name="other"/>
				<div>Component</div>
			)
			<style></style>
			<style slot="default"></style>
		}

		export default function Index() {
			return (
				<div>
					<Component><div>ChildInDefaultSlot</div></Component>
				</div>
			)
		}
		`;

		const expected = `
		<div>
			<div data-oxia-sid-a>ChildInDefaultSlot</div>
			<div data-oxia-sid-b>Component</div>
		</div>
		`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});