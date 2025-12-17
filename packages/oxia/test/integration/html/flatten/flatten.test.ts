import { getDiffableHTML } from "@open-wc/semantic-dom-diff";
import { getTestId, runOxia2Html } from "../html.util.js";

const ID = "flatten";

describe(`html-${ID}`, () => {

{
	const testId = getTestId();
	test(`${testId} `+ "should flatten array children", async () => {
		const routeCode = `
			export default function index() {
				const a = [1, 2];
				return (
					<>
						{ a.map((v) => <div>0/{v.toString()}</div>) }
						{ gen1() }
						{ gen2() }
					</>
				)
			}

			function gen1() {
				const r = [
					<div className="div">1/0</div>,
					<div className="div">1/1</div>,
				];
				return r;
			}

			function gen2() {
				const r = [
					<div className="div">2{ gen3() }</div>
				];
				return r;
			}

			function gen3() {
				return (
					<div className="div">3{ gen4() }</div>
				)
			}

			function gen4() {
				return [
					[<div className="div">4/0</div>, <div className="div">4/1</div>],
					[<div className="div">4/2</div>, <div className="div">4/3</div>],
				];
			}
		`;

		const expected = `
			<fragment>
			  <div>
			    0/1
			  </div>
			  <div>
			    0/2
			  </div>
			  <div class="div">
			    1/0
			  </div>
			  <div class="div">
			    1/1
			  </div>
			  <div class="div">
			    2
			    <div class="div">
			      3
			      <div class="div">
			        4/0
			      </div>
			      <div class="div">
			        4/1
			      </div>
			      <div class="div">
			        4/2
			      </div>
			      <div class="div">
			        4/3
			      </div>
			    </div>
			  </div>
			</fragment>
		`;
		const actual = await runOxia2Html(ID, testId, {path: "index", code: routeCode}, undefined, undefined, (options) => {
			options.build.keepFragments = true;
		});
		expect(
			getDiffableHTML(actual)
		).toBe(
			getDiffableHTML(expected)
		);
	});
}

});