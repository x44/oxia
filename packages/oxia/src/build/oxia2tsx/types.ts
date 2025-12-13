import * as ts from "typescript";

export const STYLE_ID_START_TAG = "__STYLE_ID__{";
export const STYLE_ID_END_TAG = "}__STYLE_ID__";

export const FUNCTION_ID_START_TAG = "__FUNCTION_ID__{";
export const FUNCTION_ID_END_TAG = "}__FUNCTION_ID__";

export const SET_STYLE_RESULT_FUNCTION = "__SET_STYLE_RESULT__";

export type StyleBlock = {
	styleId: string;
	fixedId: string | undefined;
	pos: number;                    // *<style attributes> xxx </style>
	end: number;                    // <style attributes> xxx </style>*

	tag: string;                    // '<style attributes>'
	tagPos: number;                 // *<style attributes> xxx </style>
	tagEnd: number;                 // <style attributes>* xxx </style>

	content: string;                // ' xxx '
	contentFull: string;            // whitespace before content + content (used for correct error linenumbers)
	contentPos: number;             // <style attributes>* xxx </style>
	contentEnd: number;             // <style attributes> xxx *</style>

	attributes: Map<string, string>;

	inline: boolean;
	slotName: string | undefined;

	tsBlocks: StyleTsBlock[];
}

export type StyleTsBlock = {
	id: string;
	code: string;
	pos: number;
	end: number;
	curlyOpenPos: number;
	curlyClosePos: number;
	backtickOpenPos: number;
	backtickClosePos: number;
}


export type CombinedStyleBlock = {
	styleId: string;
	fixedId: string | undefined;
	attributes: Map<string, string>;
	css: string;
	tsBlocks: StyleTsBlock[];
}

export type FunctionBlock = {
	functionId: string;
	pos: number;     // abs position of function
	end: number;     // abs position of function end
	txt: string;     // full function text including }
	bodyPos: number; // abs position of {
	bodyEnd: number; // abs position after }
	bodyTxt: string; // body text including { and }
	kind: string;
	name: string;

	bodyNode: ts.Node;

	returnExpressionPos?: number; // return expression start position
	returnExpressionEnd?: number; // return expression end

	parent: FunctionBlock | undefined;
	children: FunctionBlock[];

	nestingDepth: number;

	/* Where we will insert the <> and </> tags for wrapping multiple JSX return elements. */
	fragmentOpenTagInsertPos?: number;
	fragmentCloseTagInsertPos?: number;
}

export type StyleLevel = "module" | "function";

export type PreprocessedModule = {
	srcFilePath: string;
	functionIds: string[];
	/** Module-level style */
	styleId: string | undefined;
}

export type PreprocessedFunction = {
	module: PreprocessedModule;
	functionBlock: FunctionBlock;
	parentFunctionId: string | undefined;
	childFunctionIds: string[];
	styleId: string | undefined;
	slotStyleIds: string[];
}

export type PreprocessedStyle = {
	styleId: string;
	fixedId: string | undefined;
	attributes: Map<string, string>;
	level: StyleLevel;
	/** Combined CSS of all module-level styles of one module, or all function-level styles of one function. */
	css: string;
	/** Only for "function" level styles */
	functionId: string | undefined;
	parentStyleId: string | undefined;
	childStyleIds: string[];
	tsBlocks: StyleTsBlock[];
}

export type PreprocessedSlotStyle = {
	styleId: string;
	fixedId: string | undefined;
	slotName: string;
	attributes: Map<string, string>;
	css: string;
	functionId: string | undefined;
	tsBlocks: StyleTsBlock[];
}

export type ModuleInfo = {
	srcFilePath: string;
	rootFunctions: FunctionInfo[];
	/** Note that rootStyles are not necessarily on the module level! A rootStyle may also "start" at any function. */
	rootStyles: StyleInfo[];
}

export type FunctionInfo = {
	functionId: string;
	name: string;
	module: ModuleInfo;
	parent: FunctionInfo | undefined;
	children: FunctionInfo[];
	/** Ordered from lowest CSS priority (module-level) to highest CSS priority (function-level) */
	styles: StyleInfo[];
	styleIds: string[];

	/** Key: slotName */
	slotStyles: Map<string, SlotStyleInfo>;
}

type BaseStyleInfo = {
	styleId: string;
	fixedId: string | undefined;
	attributes: Map<string, string>;
	css: string;
	tsBlocks: StyleTsBlock[];
}

export type StyleInfo = BaseStyleInfo & {
	level: "module" | "function";
	/** For both "module" and "function" level styles */
	module: ModuleInfo;
	/** Only for "function" level styles */
	function: FunctionInfo | undefined;

	parent: StyleInfo | undefined;
	children: StyleInfo[];
}

export type SlotStyleInfo = BaseStyleInfo & {
	slotName: string;
	module: ModuleInfo;
	function: FunctionInfo;
}
