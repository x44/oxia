import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { test } from "vitest";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "slots-basics";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} ` + "should be empty - no slot", async () => {
		const routeCode = `
		function Component() {
			return <></>
		}
		export default function Index() {
			return <Component><div>Index</div></Component>
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
	test(`${testId} ` + "should be empty - no default slot", async () => {
		const routeCode = `
		function Component() {
			return <slot name="some" />
		}
		export default function Index() {
			return <Component><div>Index</div></Component>
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
	test(`${testId} ` + "should be empty - no named slot", async () => {
		const routeCode = `
		function Component() {
			return <slot name="some" />
		}
		export default function Index() {
			return <Component><div slot="other">Index</div></Component>
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
	test(`${testId} ` + "should be one div in unnamed default slot", async () => {
		const routeCode = `
		function Component() {
			return <slot />
		}
		export default function Index() {
			return <Component><div>Index</div></Component>
		}
		`;

		const expected = `<div>Index</div>`;
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
	test(`${testId} ` + "should be one div in named default slot", async () => {
		const routeCode = `
		function Component() {
			return <slot name="default" />
		}
		export default function Index() {
			return <Component><div>Index</div></Component>
		}
		`;

		const expected = `<div>Index</div>`;
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
	test(`${testId} ` + "should be one div in unnamed default slot with slot in caller", async () => {
		const routeCode = `
		function Component() {
			return <slot />
		}
		export default function Index() {
			return <Component><div slot="default">Index</div></Component>
		}
		`;

		const expected = `<div>Index</div>`;
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
	test(`${testId} ` + "should be one div in unnamed default slot and one in named slot", async () => {
		const routeCode = `
		function Component() {
			return <slot /><slot name="named" />
		}
		export default function Index() {
			return <Component><div>Default</div><div slot="named">Named</div></Component>
		}
		`;

		const expected = `<div>Default</div><div>Named</div>`;
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
	test(`${testId} ` + "should be one parent div with one div in unnamed default slot and one in named slot", async () => {
		const routeCode = `
		function Component() {
			return <div><slot /><slot name="named" /></div>
		}
		export default function Index() {
			return <Component><div>Default</div><div slot="named">Named</div></Component>
		}
		`;

		const expected = `<div><div>Default</div><div>Named</div></div>`;
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
		function Parent() {
			return <Child></Child>
		}
		function Child() {
			return <slot />
		}
		export default function Index() {
			return <Parent></Parent>
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
	test(`${testId} ` + "should be empty too", async () => {
		const routeCode = `
		function Parent() {
			return <Child></Child>
		}
		function Child() {
			return <slot />
		}
		export default function Index() {
			return <Parent>Index</Parent>
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
	test(`${testId} ` + "should be drilled through parent to child (1)", async () => {
		const routeCode = `
		function Parent() {
			return <Child><slot name="child" slot="child" /></Child>
		}
		function Child() {
			return <slot name="child"/>
		}
		export default function Index() {
			return <Parent><div slot="child">Index-Parent-Child</div></Parent>
		}
		`;

		const expected = `<div>Index-Parent-Child</div>`;
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
	test(`${testId} ` + "should be drilled through parent to child (2)", async () => {
		const routeCode = `
		function Parent() {
			return <Child><slot name="child" slot="child" /></Child>
		}
		function Child() {
			return <div><slot name="child"/></div>
		}
		export default function Index() {
			return <Parent><div slot="child">Index-Parent-Child</div></Parent>
		}
		`;

		const expected = `<div><div>Index-Parent-Child</div></div>`;
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
	test(`${testId} ` + "should be drilled through parent to child and be in parent", async () => {
		const routeCode = `
		function Parent() {
			return <Child><slot name="child" slot="child" /></Child>
			       <slot name="child" />
		}
		function Child() {
			return <slot name="child"/>
		}
		export default function Index() {
			return <Parent><div slot="child">Index-Parent-Child</div></Parent>
		}
		`;

		const expected = `<div>Index-Parent-Child</div><div>Index-Parent-Child</div>`;
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
	test(`${testId} ` + "should be drilled through parent to child 2 times and be in parent", async () => {
		const routeCode = `
		function Parent() {
			return <Child><slot name="child" slot="child" /></Child>
			       <slot name="child" />
		}
		function Child() {
			return <slot name="child"/><div><slot name="child"/></div>
		}
		export default function Index() {
			return <Parent><div slot="child">Index-Parent-Child</div></Parent>
		}
		`;

		const expected = `<div>Index-Parent-Child</div><div><div>Index-Parent-Child</div></div><div>Index-Parent-Child</div>`;
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
	test(`${testId} ` + "should be drilled through parent through child to sub child", async () => {
		const routeCode = `
		function Parent() {
			return <Child><slot name="child" slot="child" /></Child>
		}
		function Child() {
			return <SubChild><slot name="child" slot="subchild" /></SubChild>
		}
		function SubChild() {
			return <slot name="subchild"/>
		}
		export default function Index() {
			return <Parent><div slot="child">Index-Parent-Child-SubChild</div></Parent>
		}
		`;

		const expected = `<div>Index-Parent-Child-SubChild</div>`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});