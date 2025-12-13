import { FUNCTION_ID_END_TAG, FUNCTION_ID_START_TAG, SET_STYLE_RESULT_FUNCTION, STYLE_ID_END_TAG, STYLE_ID_START_TAG } from "../../../src/build/oxia2tsx/types.js";
import { runOxia2Tsx, testOxia2TsxRemoveActualIds, testOxia2TsxStats, trimLines } from "./oxia2tsx.util.js";

describe("oxia2tsx", () => {
	test("empty", () => {
		const src = ``
		const expected = ``;

		const actual = runOxia2Tsx(src);

		const { statsActual, statsExpected } = testOxia2TsxStats(actual, expected);
		expect(statsActual).toEqual(statsExpected);
	});

	test("no style", () => {
		const src = `
		function Component() {
			function Inner() {
			}
		}
		`;

		const expected = `
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			function Inner() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			}
		}
		`;

		const actual = runOxia2Tsx(src);
		const { statsActual, statsExpected } = testOxia2TsxStats(actual, expected);
		expect(statsActual).toEqual(statsExpected);
	});

	test("no inline style", () => {
		const src = `
		function Component() {
			function Inner() {
				<style></style>
			}
			<style>
			</style>
		}
		<style>

		</style>
		`;

		const expected = `
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			function Inner() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
				/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			}
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}
			*/
		}
		/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}

		*/
		`;

		const actual = runOxia2Tsx(src);
		const { statsActual, statsExpected } = testOxia2TsxStats(actual, expected);
		expect(statsActual).toEqual(statsExpected);
	});

	test("inline styles, scope styles before return", () => {
		const src = `
		function Component() {
			function Inner() {
				<style></style>
				return <div><style></style></div>
			}
			<style>
			</style>
			return <div><style></style></div>
		}
		<style>

		</style>
		`;

		const expected = `
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			function Inner() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
				/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
				return <div><style></style></div>
			}
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}
			*/
			return <div><style></style></div>
		}
		/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}

		*/
		`;

		const actual = runOxia2Tsx(src);
		const { statsActual, statsExpected } = testOxia2TsxStats(actual, expected);
		expect(statsActual).toEqual(statsExpected);
	});

	test("inline styles, scope styles after return", () => {
		const src = `
		function Component() {
			function Inner() {
				return <div><style></style></div>
				<style></style>
			}
			return <div><style></style></div>
			<style>
			</style>
		}
		<style>

		</style>
		`;

		const expected = `
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			function Inner() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
				return <div><style></style></div>
				/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			}
			return <div><style></style></div>
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}
			*/
		}
		/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}

		*/
		`;

		const actual = runOxia2Tsx(src);
		const { statsActual, statsExpected } = testOxia2TsxStats(actual, expected);
		expect(statsActual).toEqual(statsExpected);
	});

	test("inline styles, scope styles before and after return", () => {
		const src = `
		<style>

		</style>
		function Component() {
			<style></style>
			function Inner() {
				<style></style>
				return <div><style></style></div>
				<style></style>
			}
			<style></style>
			return <div><style></style></div>
			<style>
			</style>
		}
		<style>

		</style>
		`;

		const expected = `
		/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}

		*/
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			function Inner() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
				/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
				return <div><style></style></div>
				/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			}
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			return <div><style></style></div>
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}
			*/
		}
		/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}

		*/
		`;

		const actual = runOxia2Tsx(src);
		const { statsActual, statsExpected } = testOxia2TsxStats(actual, expected);
		expect(statsActual).toEqual(statsExpected);
	});

	test("inline styles, scope styles before and after return and auto fragments", () => {
		const src = `
		function Component() {
			function InnerUpper() {
				return <div><style>INLINE_INNER_UPPER{color: red;}</style></div>
					<div><style>INLINE_INNER_UPPER{color: red;}</style></div>
				<style>INNER_UPPER{}</style>
			}
			return (
				<div><style>INLINE{color: red;}</style></div><div><style>INLINE{color: red;}</style></div>
				<div><style>INLINE{color: red;}</style></div><div><style>INLINE{color: red;}</style></div>
			)
			<style>COMPONENT{}</style>
			function InnerLowest() {
				return <div><style>INLINE_INNER_LOWEST{color: red;}</style></div><div><style>INLINE_INNER_LOWEST{color: red;}</style></div>
				<style>INNER_LOWEST{}</style>
			}
		}
		`;

		const expected = `
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			function InnerUpper() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
				return <><div><style></style></div>
					<div><style></style></div></>
				/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			}
			return (<>
				<div><style></style></div>
				<div><style></style></div>
			</>)
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			function InnerLowest() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
				return <><div><style></style></div><div><style></style></div></>
				/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
			}
		}
		`;

		const actual = runOxia2Tsx(src);
		const { statsActual, statsExpected } = testOxia2TsxStats(actual, expected);
		expect(statsActual).toEqual(statsExpected);
	});


	// EXACT MATCHING

	test("auto fragments match exact", () => {
		const src = `
		function Component() {
			return <div></div><div></div>
			<style></style>
		}
		function Component() {
			return (<div></div><div></div>)
			<style></style>
		}
		function Component() {
			return (<div></div><div></div>
			)
			<style></style>
		}
		function Component() {
			return <div></div>
				<div></div>
			<style></style>
		}
		function Component() {
			return (<div></div>
				<div></div>)
			<style></style>
		}
		function Component() {
			return (<div></div>
				<div></div>
			)
			<style></style>
		}
		`;

		const expected = `
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return <><div></div><div></div></>
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return (<><div></div><div></div></>)
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return (<><div></div><div></div></>
			)
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return <><div></div>
				<div></div></>
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return (<><div></div>
				<div></div></>)
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return (<><div></div>
				<div></div></>
			)
			/*${STYLE_ID_START_TAG}${STYLE_ID_END_TAG}*/
		}
		`;

		const actual = testOxia2TsxRemoveActualIds(runOxia2Tsx(src));
		expect(actual).toEqual(trimLines(expected));
	});

	test("inline styles match exact", () => {
		const src = `
		function Component() {
			return <div><style>div{color:red}</style></div><div></div>
		}
		function Component() {
			return (<div><style>{\`div{color:red}\`}</style></div><div></div>)
		}
		function Component() {
			return <div>
				<style>
					div {
						color: red;
					}
				</style>
			</div>
				<div></div>
		}
		function Component() {
			return (<div></div>
				<div></div>
				<style>
					div {
						color: red;
					}
				</style>
				<div></div>
			)
		}
		`;

		const expected = `
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return <><div><style>{\`div{color:red}\`}</style></div><div></div></>
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return (<><div><style>{\`div{color:red}\`}</style></div><div></div></>)
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return <><div>
				<style>{\`
					div {
						color: red;
					}
				\`}</style>
			</div>
				<div></div></>
		}
		function Component() {${FUNCTION_ID_START_TAG}${FUNCTION_ID_END_TAG}
			return (<><div></div>
				<div></div>
				<style>{\`
					div {
						color: red;
					}
				\`}</style>
				<div></div></>
			)
		}

		${SET_STYLE_RESULT_FUNCTION}("", \`div{color:red}\`);`;

		const actual = testOxia2TsxRemoveActualIds(runOxia2Tsx(src));

		expect(actual).toEqual(trimLines(expected));
	});
});