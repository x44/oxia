import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "styles-basics";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "should be div without data-oxia-sid", async () => {
		const routeCode = `
		function Component() {
			return <></>
		}
		export default function Index() {
			return <div></div>
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
	test(`${testId} ` + "should be div data-oxia-sid-a", async () => {
		const routeCode = `
		function Component() {
			return <></>
		}
		export default function Index() {
			return <div></div>
		}

		<style></style>
		`;

		const expected = `<div data-oxia-sid-a></div>`;
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
	test(`${testId} ` + "should be 2 divs data-oxia-sid-a", async () => {
		const routeCode = `
		function Component() {
			return <></>
		}
		export default function Index() {
			return <div></div><div></div>
		}

		<style></style>
		`;

		const expected = `<div data-oxia-sid-a></div><div data-oxia-sid-a></div>`;
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
	test(`${testId} ` + "should be 2 divs data-oxia-sid-a", async () => {
		const routeCode = `
		function Component() {
			return <></>
		}
		export default function Index() {
			return <div></div><div></div>
			<style></style>
		}
		`;

		const expected = `<div data-oxia-sid-a></div><div data-oxia-sid-a></div>`;
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
	test(`${testId} ` + "should be 2 divs data-oxia-sid-a", async () => {
		const routeCode = `
		function Component() {
			return <></>
		}
		export default function Index() {
			return <div></div><div></div>
			<style></style>
		}

		<style></style>
		`;

		const expected = `<div data-oxia-sid-a></div><div data-oxia-sid-a></div>`;
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
	test(`${testId} ` + "should be 2 divs data-oxia-sid-a", async () => {
		const routeCode = `
		function Component() {
			return <></>
			<style></style>
		}
		export default function Index() {
			return <div></div><Component/><div></div>
			<style></style>
		}

		<style></style>
		`;

		const expected = `<div data-oxia-sid-a></div><div data-oxia-sid-a></div>`;
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
	test(`${testId} ` + "should be 2 divs data-oxia-sid-a 1 div data-oxia-sid-b", async () => {
		const routeCode = `
		function Component() {
			return <div></div>
			<style></style>
		}
		export default function Index() {
			return <div></div><div></div><Component/>
			<style></style>
		}

		<style></style>
		`;

		const expected = `<div data-oxia-sid-a></div><div data-oxia-sid-a></div><div data-oxia-sid-b></div>`;
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
	test(`${testId} ` + "should be 2+1 divs data-oxia-sid-a 1+1 div data-oxia-sid-b", async () => {
		const routeCode = `
		function Component() {
			return <div><div></div></div>
			<style></style>
		}
		export default function Index() {
			return <div><div></div></div><div><div></div></div><Component/>
			<style></style>
		}

		<style></style>
		`;

		const expected = `<div data-oxia-sid-a><div data-oxia-sid-a></div></div><div data-oxia-sid-a><div data-oxia-sid-a></div></div><div data-oxia-sid-b><div data-oxia-sid-b></div></div>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});