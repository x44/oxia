import { getFunction } from "../build/oxia2tsx/module-registry.js";
import { FUNCTION_ID_END_TAG, FUNCTION_ID_START_TAG, type FunctionInfo, type SlotStyleInfo } from "../build/oxia2tsx/types.js";
import { Log } from "../util/log.js";
import { uuid } from "../util/uuid.js";
import Element from "./elements/Element.js";

export class React {
	/** The absolute src static dir. Default is absolute("./static") */
	static srcStaticDir: string;
	/** The absolute src root dir. Default is absolute("./src") */
	static srcSourceDir: string;
	/** The absolute src routes dir. Default is absolute("./src/routes") */
	static srcRoutesDir: string;

	/** The absolute dist static dir. Default is absolute("./dist") */
	static dstStaticDir: string;
	/** The absolute dist routes dir. Default is absolute("./dist") */
	static dstRoutesDir: string;

	/** The absolute path of the src file currently being converted. The src file is in the srcRoutesDir. */
	static srcFilePath: string;
	/** The absolute dir of the src file currently being converted. This is dirname(srcFilePath). */
	static srcFileDir: string;
	/** The name of the src file currently being converted. This is basename(srcFilePath). */
	static srcFileName: string;

	/** The absolute path of the dst file currently being converted. The dst file is in the dstRoutesDir. */
	static dstFilePath: string;
	/** The absolute dir of the dst file currently being converted. This is dirname(dstFilePath). */
	static dstFileDir: string;
	/** The name of the dst file currently being converted. This is basename(dstFilePath). */
	static dstFileName: string;

	/** The root element of the tree. This always is a <fragment> */
	private static root: Element | undefined;
	/** The <html> element of the tree. Undefined if no <html> exists. This never is a <fragment> */
	private static html: Element | undefined;
	/** The <head> element of the tree. Undefined if no <head> exists. This never is a <fragment> */
	private static head: Element | undefined;
	/** The <body> element of the tree. Undefined if no <body> exists. This never is a <fragment> */
	private static body: Element | undefined;

	private static usedModules = new Set<string>();

	static reset() {
		this.root = undefined;
		this.html = undefined;
		this.head = undefined;
		this.body = undefined;
		this.usedModules.clear();
	}

	/** The root element of the tree. This always is a <fragment> */
	static getRoot() {
		return this.root;
	}

	/** The <html> element of the tree. Undefined if no <html> exists. This never is a <fragment> */
	static getHtml() {
		return this.html;
	}

	/** The <head> element of the tree. Undefined if no <head> exists. This never is a <fragment> */
	static getHead() {
		return this.head;
	}

	/** The <body> element of the tree. Undefined if no <body> exists. This never is a <fragment> */
	static getBody() {
		return this.body;
	}

	static getUsedModules() {
		return [...this.usedModules];
	}

	static createElement(tagOrFunction: string | ((props: any) => Element), props: any, ...children: (string | Element)[]) {
		if (!tagOrFunction) {
			tagOrFunction = "fragment";
		}

		let element: Element;

		if (typeof tagOrFunction === "string") {
			element = new Element(tagOrFunction, props || {});

			if (element.getTag() === "html") {
				this.html = element;
			} else
			if (element.getTag() === "head") {
				this.head = element;
			} else
			if (element.getTag() === "body") {
				this.body = element;
			}

		} else {

			let functionInfo = React.parseFunctionInfo(tagOrFunction);
			if (functionInfo) {
				const module = functionInfo.module;
				this.usedModules.add(module.srcFilePath);
			} else {
				functionInfo = React.createFunctionInfo(tagOrFunction);
			}

			element = tagOrFunction(props || {});

			if (!element) {
				Log.warn(`function '${tagOrFunction.name}' returned no content`);
				return undefined;
			}

			if (typeof element === "string") {
				// function returned just a string - this is OK in TSX
				const text = element;
				element = new Element("#text", {});
				element.setText(text);
			}

			// Wrap every element that was returned by a function in a fragment,
			// - if the returned element is not a fragment or
			// - if the returned element is a fragment and is the returned fragment
			//   of another function. This happens in the follwing scenario:
			//
			//   function Parent() {
			//     return <Child></Child>
			//   }
			//   function Child() {...}
			//
			//   Parent() just returns the result of Child() (the fragment of Child())
			//   In this case we must wrap the fragment of Child() in another fragment
			//   that belongs to (gets assigned to) Parent()!

			// This must be done right after the element got created to ensure
			// that further added elements (injected elements) get added to the
			// fragment and not to the element the function originally returned!

			const isFragmentOfChild = element.isFragment() && (element.getComponentFunction() !== undefined);

			if (!element.isFragment() || isFragmentOfChild) {
				// important("React: wrapping in fragment:", element.getTag(), "which is the return of function", tagOrFunction.name);
				const fragment = new Element("fragment", props || {});
				this.assignComponentFunction(fragment, tagOrFunction, functionInfo);
				fragment.addChildren([element]);
				element = fragment;
			} else {
				// Function returned a fragment, and the fragment was created by the function, not just passed through
				this.assignComponentFunction(element, tagOrFunction, functionInfo);
				element.setProps(props || {});
			}
		}

		// !!! Must always call addChildren() even if children is empty!!!
		// This gets called twice on each element.
		// 1st with the element's "internal" children (which the element function created)
		// 2nd with those elements the caller of the element function injects
		//
		// function MyElement() {
		//    return (
		//        <div></div>   <-- the "internal" children
		//    )
		// }
		//
		// <div>
		//     <MyElement>
		//         <div></div>  <-- the "injected" children
		//     </MyElement>
		// </div>

		children = this.flatten(children);

		element.addChildren(children);

		React.root = element;
		return element;
	}

	private static flatten(a: (string | Element)[]): (string | Element)[] {
		return a.flatMap((v) => Array.isArray(v) ? this.flatten(v) : v);
	}

	private static assignComponentFunction(element: Element, func: (props: any) => Element, functionInfo: FunctionInfo) {
		element.setComponentFunction(func, functionInfo);
	}

	private static parseFunctionInfo(tagOrFunction: (props: any) => Element) {
		let functionCode = tagOrFunction.toString();
		let funcIdStartPos = functionCode.indexOf(FUNCTION_ID_START_TAG);
		if (funcIdStartPos === -1) {
			// warn(`no ${FUNCTION_ID_START_TAG} found`);
			return undefined;
		}
		funcIdStartPos += FUNCTION_ID_START_TAG.length;
		let funcIdEndPos = functionCode.indexOf(FUNCTION_ID_END_TAG, funcIdStartPos);
		if (funcIdEndPos === -1) {
			// warn(`no ${FUNCTION_ID_END_TAG} found`);
			return undefined;
		}
		const functionId = functionCode.substring(funcIdStartPos, funcIdEndPos);
		const functionInfo = getFunction(functionId);
		return functionInfo;
	}

	/**
	 * Create a FunctionInfo for builtin Components (Script, Style)
	 * We could just simply change the file extension of Script.tsx and Style.tsx to ".oxia"
	 * but the funny VS Code marks the imports as error. Don't know how to fix this.
	 */
	private static createFunctionInfo(tagOrFunction: (props: any) => Element) {
		const functionInfo: FunctionInfo = {
			name: tagOrFunction.name,
			functionId: uuid(),
			parent: undefined,
			children: [],
			style: undefined,
			styleId: undefined,
			slotStyles: new Map<string, SlotStyleInfo>(),
			module: {
				srcFilePath: "builtin",
				rootFunctions: [],
				rootScopedStyles: [],
				globalStyle: undefined,
			}
		};
		return functionInfo;
	}
}

export { };

