import type { CombinedStyleBlock, FunctionBlock, PreprocessedFunction, PreprocessedModule, PreprocessedSlotStyle, PreprocessedStyle, StyleLevel } from "./types.js";

/** Key: srcFilePath */
const moduleRegistry = new Map<string, PreprocessedModule>();
/** Key: functionId */
const functionRegistry = new Map<string, PreprocessedFunction>();
/** Key: styleId Contains module-level and function-level styles */
const styleRegistry = new Map<string, PreprocessedStyle>();
/** Key: slotStyleId */
const slotStyleRegistry = new Map<string, PreprocessedSlotStyle>();

export function deletePreprocessedModule(srcFilePath: string) {
	const module = moduleRegistry.get(srcFilePath);
	if (!module) return;
	moduleRegistry.delete(srcFilePath);

	// Delete module-level style
	if (module.styleId) styleRegistry.delete(module.styleId);

	// Delete functions
	for (const functionId of module.functionIds) {
		const func = functionRegistry.get(functionId);
		if (!func) continue;
		functionRegistry.delete(functionId);
		// Delete function-level style
		if (func.styleId) styleRegistry.delete(func.styleId);
		// Delete funcition slot styles
		for (const slotStyleId of func.slotStyleIds) {
			slotStyleRegistry.delete(slotStyleId);
		}
	}
}

export function createPreprocessedModule(srcFilePath: string) {
	const module: PreprocessedModule = {
		srcFilePath,
		functionIds: [],
		styleId: undefined,
	};
	moduleRegistry.set(srcFilePath, module);
}

export function createPreprocessedFunction(srcFilePath: string, functionBlock: FunctionBlock) {
	const module = moduleRegistry.get(srcFilePath)!;
	const func: PreprocessedFunction = {
		module,
		functionBlock: functionBlock,
		parentFunctionId: functionBlock.parent?.functionId,
		childFunctionIds: functionBlock.children.map(child => child.functionId),
		styleId: undefined,
		slotStyleIds: [],
	};
	module.functionIds.push(functionBlock.functionId);
	functionRegistry.set(functionBlock.functionId, func);
}


export function createPreprocessedModuleStyle(srcFilePath: string, styleBlock: CombinedStyleBlock) {
	const style = createPreprocessedStyle("module", styleBlock);
	const module = moduleRegistry.get(srcFilePath)!;
	module.styleId = style.styleId;
}

export function createPreprocessedFunctionStyle(functionId: string, styleBlock: CombinedStyleBlock) {
	const style = createPreprocessedStyle("function", styleBlock);
	const func = functionRegistry.get(functionId)!;
	func.styleId = style.styleId;
	style.functionId = functionId;
}

export function createPreprocessedFunctionSlotStyle(functionId: string, slotName: string, styleBlock: CombinedStyleBlock) {
	const style = createPreprocessedSlotStyle(slotName, styleBlock);
	const func = functionRegistry.get(functionId)!;
	func.slotStyleIds.push(style.styleId);
	style.functionId = functionId;
}


function createPreprocessedStyle(level: StyleLevel, styleBlock: CombinedStyleBlock) {
	const style: PreprocessedStyle = {
		styleId: styleBlock.styleId,
		fixedId: styleBlock.fixedId,
		attributes: styleBlock.attributes,
		css: styleBlock.css,
		level,
		functionId: undefined,
		parentStyleId: undefined,
		childStyleIds: [],
		tsBlocks: [...styleBlock.tsBlocks],
	};
	styleRegistry.set(style.styleId, style);
	return style;
}

function createPreprocessedSlotStyle(slotName: string, styleBlock: CombinedStyleBlock) {
	const style: PreprocessedSlotStyle = {
		styleId: styleBlock.styleId,
		fixedId: styleBlock.fixedId,
		slotName,
		attributes: styleBlock.attributes,
		css: styleBlock.css,
		functionId: undefined,
		tsBlocks: [...styleBlock.tsBlocks],
	};
	slotStyleRegistry.set(style.styleId, style);
	return style;
}

export function getPreprocessedModule(srcFilePath: string) {
	return moduleRegistry.get(srcFilePath)!;
}

export function getPreprocessedFunction(functionId: string) {
	return functionRegistry.get(functionId)!;
}

export function getPreprocessedStyle(styleId: string) {
	return styleRegistry.get(styleId)!;
}

export function getPreprocessedSlotStyle(slotStyleId: string) {
	return slotStyleRegistry.get(slotStyleId)!;
}

function getPreprocessedModuleStyleId(srcFilePath: string) {
	const module = moduleRegistry.get(srcFilePath)!;
	return module.styleId;
}

function getPreprocessedModuleStyle(srcFilePath: string) {
	const module = moduleRegistry.get(srcFilePath)!;
	return module.styleId ? getPreprocessedStyle(module.styleId) : undefined;
}

function getPreprocessedFunctionStyleId(functionId: string) {
	const func = functionRegistry.get(functionId)!;
	return func.styleId;
}

function getPreprocessedFunctionStyle(functionId: string) {
	const func = functionRegistry.get(functionId)!;
	return func.styleId ? getPreprocessedStyle(func.styleId) :  undefined;
}

export function treeifyPreprocessedStyles(srcFilePath: string) {
	const module = moduleRegistry.get(srcFilePath)!;

	// Create the style tree hierarchy using the function hierarchy
	const moduleStyle = module.styleId ? styleRegistry.get(module.styleId) : undefined;
	let parentStyle = moduleStyle;
	for (const functionId of module.functionIds) {
		const func = functionRegistry.get(functionId)!;
		if (!func.parentFunctionId) {
			// Root functions only
			treeifyStyle(parentStyle, func);
		}
	}
}

function treeifyStyle(parentStyle: PreprocessedStyle | undefined, func: PreprocessedFunction) {
	if (func.styleId) {
		const funcStyle = styleRegistry.get(func.styleId)!;
		if (parentStyle) {
			parentStyle.childStyleIds.push(funcStyle.styleId);
			funcStyle.parentStyleId = parentStyle.styleId;
		}
		parentStyle = funcStyle;
	}
	for (const childFunctionId of func.childFunctionIds) {
		const childFunc = functionRegistry.get(childFunctionId)!;
		treeifyStyle(parentStyle, childFunc);
	}
}

export function dumpPreprocessedModule(srcFilePath: string) {
	const module = moduleRegistry.get(srcFilePath)!;
	console.log("-----------------------------------------------------------------------------------------------");
	console.log(`Module '${module.srcFilePath}'`);

	const moduleStyle = getPreprocessedModuleStyle(srcFilePath);
	if (moduleStyle) {
		console.log(`  Style ${moduleStyle.styleId}`);
	}

	const functionIds = module.functionIds;
	functionIds.forEach(functionId => {
		const func = getPreprocessedFunction(functionId);
		if (!func.parentFunctionId) {
			dumpFunction(func);
		}
	});
	console.log("-----------------------------------------------------------------------------------------------");
}

function dumpFunction(func: PreprocessedFunction, indent = 1) {
	const functionId = func.functionBlock.functionId;
	console.log(`${" ".repeat((indent) * 2)}Function ${functionId} '${func.functionBlock.name}'`);

	const functionStyle = getPreprocessedFunctionStyle(functionId);
	if (functionStyle) {
		console.log(`${" ".repeat((indent + 1) * 2)}Style ${functionStyle.styleId}`);
	}

	for (const childFunctionId of func.childFunctionIds) {
		dumpFunction(getPreprocessedFunction(childFunctionId), indent + 1);
	}
}
