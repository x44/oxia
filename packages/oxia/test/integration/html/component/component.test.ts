import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "component";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "invoking internal and imported component function", async () => {
		const routeCode = `
		import { ImportedComponent } from "../components/ImportedComponent.oxia";

		type InternalComponentProps = {
			text: string;
		}

		function InternalComponent({text}: InternalComponentProps) {
			return <div>InternalComponent '{text}'</div>
		}

		export default function Index() {
			return	<ImportedComponent text="Index"></ImportedComponent>
					<InternalComponent text="Index"></InternalComponent>
		}
		`;

		const componentCode = `
		type ImportedComponentProps = {
			text: string;
		}

		export function ImportedComponent({text}: ImportedComponentProps) {
			return <div>ImportedComponent '{text}'</div>;
		}
		`;

		const expected = `
			<div>ImportedComponent 'Index'</div>
			<div>InternalComponent 'Index'</div>
		`;

		const actual = await runOxia2Html(ID, testId,
			{path: "index", code: routeCode},
			[{path: "ImportedComponent", code: componentCode}],
			[]
		);

		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

{
	const testId = getTestId();
	test(`${testId} ` + "invoking internal and imported component function", async () => {
		const routeCode = `
		import { ImportedComponent } from "../components/ImportedComponent.oxia";

		type InternalComponentProps = {
			text: string;
		}

		function InternalComponent1({text}: InternalComponentProps) {
			return 	<div>InternalComponent1 '{text}'</div>
					<InternalComponent2 text={text}></InternalComponent2>
		}

		function InternalComponent2({text}: InternalComponentProps) {
			return 	<div>InternalComponent2 '{text}'</div>
					<ImportedComponent text={text}></ImportedComponent>
		}

		export default function Index() {
			return	<InternalComponent1 text="Index"></InternalComponent1>
		}
		`;

		const componentCode = `
		type ImportedComponentProps = {
			text: string;
		}

		export function ImportedComponent({text}: ImportedComponentProps) {
			return <div>ImportedComponent '{text}'</div>;
		}
		`;

		const expected = `
			<div>InternalComponent1 'Index'</div>
			<div>InternalComponent2 'Index'</div>
			<div>ImportedComponent 'Index'</div>
		`;

		const actual = await runOxia2Html(ID, testId,
			{path: "index", code: routeCode},
			[{path: "ImportedComponent", code: componentCode}],
			[]
		);

		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});