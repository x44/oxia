import { uuid } from "../../util/uuid.js";
import { getPreprocessedFunction, getPreprocessedSlotStyle, getPreprocessedStyle } from "./preprocess-registry.js";
import { type FunctionInfo, type ModuleInfo, type PreprocessedFunction, type PreprocessedModule, type PreprocessedSlotStyle, type PreprocessedStyle, type SlotStyleInfo, type StyleInfo } from "./types.js";

/** Key: srcFilePath */
const moduleRegistry = new Map<string, ModuleInfo>();
/** Key: functionId */
const functionRegistry = new Map<string, FunctionInfo>();
/** Key: styleId */
const globalStyleRegistry = new Map<string, StyleInfo>();
/** Key: styleId */
const scopedStyleRegistry = new Map<string, StyleInfo>();
/** Key: styleId */
const slotStyleRegistry = new Map<string, SlotStyleInfo>();

export function deleteModule(srcFilePath: string) {
	// Module
	const module = moduleRegistry.get(srcFilePath);
	if (!module) return;
	moduleRegistry.delete(module.srcFilePath);

	// Functions
	for (const func of module.rootFunctions) {
		deleteFunction(func);
	}

	// Global Style
	if (module.globalStyle) {
		deleteGlobalStyle(module.globalStyle);
	}

	// Scoped Styles
	for (const style of module.rootScopedStyles) {
		deleteScopedStyle(style);
	}
}

function deleteFunction(func: FunctionInfo) {
	functionRegistry.delete(func.functionId);
	for (const child of func.children) {
		deleteFunction(child);
	}

	for (const style of func.slotStyles.values()) {
		deleteSlotStyle(style);
	}
}

function deleteGlobalStyle(style: StyleInfo) {
	globalStyleRegistry.delete(style.styleId);
}

function deleteScopedStyle(style: StyleInfo) {
	scopedStyleRegistry.delete(style.styleId);
	for (const child of style.children) {
		deleteScopedStyle(child);
	}
}

function deleteSlotStyle(style: SlotStyleInfo) {
	slotStyleRegistry.delete(style.styleId);
}

export function createModule(srcModule: PreprocessedModule) {
	const srcFilePath = srcModule.srcFilePath;
	let module = moduleRegistry.get(srcFilePath);
	if (!module) {
		module = {
			srcFilePath,
			rootFunctions: [],
			rootScopedStyles: [],
			globalStyle: undefined,
		}
		moduleRegistry.set(srcFilePath, module);
	}

	const rootStyleIds: string[] = [];

	for (const functionId of srcModule.functionIds) {
		const srcFunction = getPreprocessedFunction(functionId);
		if (!srcFunction.parentFunctionId) {
			// Root functions only
			const func = addFunction(module, undefined, srcFunction);
			module.rootFunctions.push(func);

			if (srcFunction.styleId) {
				rootStyleIds.push(srcFunction.styleId);
			}
		}

		for (const slotStyleId of srcFunction.slotStyleIds) {
			const slotStyle = getPreprocessedSlotStyle(slotStyleId);
			addSlotStyle(slotStyle);
		}
	}

	if (srcModule.globalStyleId) {
		const srcStyle = getPreprocessedStyle(srcModule.globalStyleId);
		const style = addStyle(module, undefined, srcStyle);
		module.globalStyle = style;
	}

	if (srcModule.scopedStyleId) {
		rootStyleIds.push(srcModule.scopedStyleId);
	}

	for (const rootStyleId of rootStyleIds) {
		const srcStyle = getPreprocessedStyle(rootStyleId);
		if (!srcStyle.parentStyleId) {
			// Root styles only
			const style = addStyle(module, undefined, srcStyle);
			module.rootScopedStyles.push(style);
		}
	}
}

function addFunction(module: ModuleInfo, parent: FunctionInfo | undefined, src: PreprocessedFunction) {
	const func: FunctionInfo = {
		functionId: src.functionBlock.functionId,
		name: src.functionBlock.name,
		module,
		parent,
		children: [],
		styles: [],
		styleIds: [],
		slotStyles: new Map<string, SlotStyleInfo>(),
	};

	functionRegistry.set(func.functionId, func);

	if (parent) {
		parent.children.push(func);
	}

	for (const childFunctionId of src.childFunctionIds) {
		addFunction(module, func, getPreprocessedFunction(childFunctionId));
	}

	return func;
}

function addStyle(module: ModuleInfo, parent: StyleInfo | undefined, src: PreprocessedStyle) {
	const func = src.level === "function" ? functionRegistry.get(src.functionId!) : undefined;

	const style: StyleInfo = {
		styleId: src.fixedId || uuid(),
		fixedId: src.fixedId,
		attributes: src.attributes,
		css: src.css,
		level: src.level,
		module,
		function: func,
		parent,
		children: [],
		tsBlocks: [...src.tsBlocks],
	};

	if (src.level === "global") {
		globalStyleRegistry.set(style.styleId, style);
	} else {
		scopedStyleRegistry.set(style.styleId, style);

		addStyleToFunctions(module, style);

		if (parent) {
			parent.children.push(style);
		}

		for (const childStyleId of src.childStyleIds) {
			addStyle(module, style, getPreprocessedStyle(childStyleId));
		}
	}

	return style;
}

function addSlotStyle(src: PreprocessedSlotStyle) {
	const func = functionRegistry.get(src.functionId!)!;
	const module = func.module;

	const style: SlotStyleInfo = {
		styleId: src.fixedId || src.styleId,
		fixedId: src.fixedId,
		slotName: src.slotName,
		attributes: src.attributes,
		css: src.css,
		module,
		function: func,
		tsBlocks: [...src.tsBlocks],
	};

	slotStyleRegistry.set(style.styleId, style);

	func.slotStyles.set(style.slotName, style);

	return style;
}

function addStyleToFunctions(module: ModuleInfo, style: StyleInfo) {
	for (const func of module.rootFunctions) {
		addStyleToFunction(func, style);
	}
}

function addStyleToFunction(func: FunctionInfo, style: StyleInfo, add = false) {
	if (!add) {
		if (style.level === "module" || style.function === func) {
			add = true;
		}
	}

	if (add) {
		// remove all styles we inherited so far
		func.styles = [style];
		func.styleIds = [style.styleId];
	}

	for (const childFunc of func.children) {
		addStyleToFunction(childFunc, style, add);
	}
}

export function getGlobalStylesForModules(srcFilePaths: string[]) {
	const styles: StyleInfo[] = [];
	for (const srcFilePath of srcFilePaths) {
		const module = moduleRegistry.get(srcFilePath)!;
		if (module.globalStyle) {
			styles.push(module.globalStyle);
		}
	}
	return styles;
}

export function getFunction(functionId: string) {
	return functionRegistry.get(functionId)!;
}

export function dumpModule(srcFilePath: string) {
	const module = moduleRegistry.get(srcFilePath)!;
	console.log("-----------------------------------------------------------------------------------------------");
	console.log(`Module '${module.srcFilePath}'`);
	for (const func of module.rootFunctions) {
		dumpFunction(func);
	}
	console.log("-----------------------------------------------------------------------------------------------");
}

function dumpFunction(func: FunctionInfo, indent = 1) {
	console.log(`${" ".repeat(indent * 2)}Function ${func.functionId} '${func.name}'`);
	for (const style of func.styles) {
		console.log(`${" ".repeat((indent + 1) * 2)}Style ${style.styleId}`);
	}
	for (const childFunc of func.children) {
		dumpFunction(childFunc, indent + 1);
	}
}
