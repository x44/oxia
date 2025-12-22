import { getOrCreateMapEntry } from "../../util/map.js";
import { blankCommentsAndStrings, findCharBwd, findCharFwd, whitespaceOnly } from "../../util/string.js";
import { uuid } from "../../util/uuid.js";
import { createPreprocessedFunctionSlotStyle, createPreprocessedFunctionStyle, createPreprocessedGlobalStyle, createPreprocessedModuleStyle } from "./preprocess-registry.js";
import { STYLE_ID_END_TAG, STYLE_ID_START_TAG, type CombinedStyleBlock, type FunctionBlock, type StyleBlock, type StyleTsBlock } from "./types.js";

export function extractStyleBlocks(srcCode: string): StyleBlock[] {
	const styleBlocks: StyleBlock[] = [];

	if (!srcCode.includes("<style")) return styleBlocks;

	// Hide comment sections and strings
	const blanked = blankCommentsAndStrings(srcCode);

	// We use this whitespace (only \t \r \n ' ') string to create style content that is at it's original
	// file location with everything before the content whitespaced. Used to get correct error linenumbers.
	const white = whitespaceOnly(srcCode);

	const styleRegex = /(<style[\s\S]*?>)([\s\S]*?)(<\/style>)/g;
	let match;

	while ((match = styleRegex.exec(blanked)) !== null) {
		const pos = match.index;
		const tagPos = pos;
		const tag = srcCode.substring(tagPos, tagPos + match[1].length);
		const tagEnd = tagPos + tag.length;
		const contentPos = tagEnd;
		const content = srcCode.substring(contentPos, contentPos + match[2].length);
		const contentEnd = contentPos + content.length;
		const contentFull = white.substring(0, contentPos) + content;
		const end = contentEnd + match[3].length;
		const attributes = parseAttributes(tag);

		const fixedId = attributes.get("data-oxia-sid");

		const global = attributes.has("global");

		let slotName = attributes.get("slot");
		if (slotName !== undefined) {
			if (slotName === "") {
				slotName = "default";
			}
		}

		const styleBlock: StyleBlock = {
			styleId: fixedId || uuid(),
			fixedId,

			pos,
			end,

			tag,
			tagPos,
			tagEnd,

			content,
			contentPos,
			contentEnd,
			contentFull,

			attributes,

			inline: false,
			global,
			slotName,

			tsBlocks: [],
		};

		parseStyleBlockTsCode(styleBlock);

		styleBlocks.push(styleBlock);
	}

	return styleBlocks;
}

function parseStyleBlockTsCode(styleBlock: StyleBlock) {

	// Classify the style either
	// - css <style>...</style>
	// - ts <style>{`...`}</style>

	const contentFull = styleBlock.contentFull;

	// console.log("---------------------------------------------");
	// console.log(contentFull);
	// console.log("---------------------------------------------");

	const start = styleBlock.contentPos;
	const end = styleBlock.contentEnd;

	const [curlyOpen, curlyOpenPos] = findCharFwd(contentFull, start, end);
	const [backtickOpen, backtickOpenPos] = curlyOpen === "{" ? findCharFwd(contentFull, curlyOpenPos + 1, end) : ["", -1];
	const [curlyClose, curlyClosePos] = backtickOpen === "`" ? findCharBwd(contentFull, end - 1, backtickOpenPos + 1) : ["", -1];
	const [backtickClose, backtickClosePos] = curlyClose === "}" ? findCharBwd(contentFull, curlyClosePos - 1, backtickOpenPos + 1) : ["", -1];

	if (backtickClose === "`") {
		const tsBlock: StyleTsBlock = {
			id: uuid(),
			code: contentFull.substring(backtickOpenPos, backtickClosePos + 1),
			pos: curlyOpenPos,
			end: curlyClosePos + 1,
			curlyOpenPos,
			curlyClosePos,
			backtickOpenPos,
			backtickClosePos,
		};
		styleBlock.tsBlocks.push(tsBlock);
	} else {
		// Parse inner {``} property values. For example, color: {`...`};
		const tsBlocks = parseTsBlocks(contentFull, start, end);
		styleBlock.tsBlocks.push(...tsBlocks);
	}
}

function parseTsBlocks(content: string, start: number, end: number) {
	const sections: StyleTsBlock[] = [];
	let pos = start;
	while (pos < end) {
		const section = parseTsBlock(content, pos, end);
		if (section) {
			sections.push(section);
			pos = section.end;
		} else {
			++pos;
		}
	}
	return sections;
}

function parseTsBlock(content: string, start: number, end: number) {
	const [curlyOpen, curlyOpenPos] = findCharFwd(content, start, end);
	if (curlyOpen !== "{") return undefined;
	const [backtickOpen, backtickOpenPos] = findCharFwd(content, curlyOpenPos + 1, end);
	if (backtickOpen !== "`") return undefined;

	let backtickClosePos = -1;
	let pos = backtickOpenPos + 1;
	let prev = "";
	while (pos < end) {
		const c = content.charAt(pos);
		if (c === "`" && prev !== "\\") {
			backtickClosePos = pos;
			break;
		}
		prev = c;
		++pos;
	}
	if (backtickClosePos === -1) return undefined;

	const [curlyClose, curlyClosePos] = findCharFwd(content, backtickClosePos + 1, end);
	if (curlyClose !== "}") return undefined;
	const section: StyleTsBlock = {
		id: uuid(),
		code: content.substring(backtickOpenPos, backtickClosePos + 1),
		pos: curlyOpenPos,
		end: curlyClosePos + 1,
		curlyOpenPos,
		curlyClosePos,
		backtickOpenPos,
		backtickClosePos,
	};
	return section;
}

/**
 * Parses attributes into a Map.
 * @param tag \<style attributes\>
 */
function parseAttributes(tag: string) {
	const map = new Map<string, string>();
	const s = tag.substring(6, tag.length - 1).trim();
	if (s.length === 0) return map;
	// s: abc="123" def="456" xyz is:aaa
	const len = s.length;
	let pos = 0;
	while (pos < len) {
		const key = parseKey();
		if (key === undefined) break;
		const isAssign = assign();
		if (!isAssign) {
			map.set(key, "");
		} else {
			const val = parseVal();
			if (val === undefined) break;
			map.set(key, val);
		}
	}

	function parseKey() {
		if (pos >= len) return undefined;
		const start = pos;
		while (pos < len) {
			const c = s.charAt(pos);
			if (c === "=" || c === " " || c === "\t" || c === "\r" || c === "\n") break;
			++pos;
		}
		return s.substring(start, pos);
	}

	function parseVal() {
		if (pos >= len) return undefined;
		// skip quote
		const quote = s.charAt(pos++);
		const start = pos;
		while (pos < len) {
			const c = s.charAt(pos);
			if (c === quote) {
				break;
			}
			++pos;
		}
		return s.substring(start, pos++); // pos++ skips trailing quote
	}

	function assign() {
		const c = skipWhite();
		if (c === "=") {
			// position at next char
			++pos;
			skipWhite();
			return true;
		}
		return false;
	}

	function skipWhite() {
		while (pos < len) {
			const c = s.charAt(pos);
			if (c !== " " && c !== "\t" && c !== "\r" && c !== "\n") return c;
			++pos;
		}
		return undefined;
	}

	return map;
}

export function hideStyleBlocks(srcCode: string, styleBlocks: StyleBlock[]) {
	if (!styleBlocks.length) return srcCode;
	let pos = 0;
	let out = "";
	for (let i = 0; i < styleBlocks.length; ++i) {
		const styleBlock = styleBlocks[i];
		out += srcCode.substring(pos, styleBlock.pos);

		for (let p = styleBlock.pos; p < styleBlock.end; ++p) {
			let c = srcCode[p];
			if (c === "\n" || c === "\r" || c === "\t") {
				out += c;
			} else {
				out += " ";
			}
		}

		pos = styleBlock.end;
	}
	out += srcCode.substring(pos);
	return out;
}

/**
 * Marks inline style blocks. Assigns non-inline style blocks to function or module.
 */
export function processStyleBlocks(srcFilePath: string, styleBlocks: StyleBlock[], functionBlocks: FunctionBlock[]) {

	const globalStyleBlocks: StyleBlock[] = [];
	const moduleStyleBlocks: StyleBlock[] = [];
	const functionStyleBlocksMap = new Map<FunctionBlock, StyleBlock[]>();
	const functionSlotStyleBlocksMap = new Map<FunctionBlock, StyleBlock[]>();

	for (let i = 0; i < styleBlocks.length; ++i) {
		const styleBlock = styleBlocks[i];

		// The function we will possibly assign this style to
		let owningFunctionBlock: FunctionBlock | undefined = undefined;

		// Find the function that "owns" the style block and mark inline style blocks
		for (let j = 0; j < functionBlocks.length; ++j) {
			const functionBlock = functionBlocks[j];

			if (styleBlock.pos >= functionBlock.bodyPos && styleBlock.pos <= functionBlock.bodyEnd) {
				// Style block is inside the function block.
				// Check if the function block is the "closest" enclosing
				if (!owningFunctionBlock || functionBlock.nestingDepth > owningFunctionBlock.nestingDepth) {
					owningFunctionBlock = functionBlock;
				}
			}

			if (functionBlock.returnExpressionPos === undefined || functionBlock.returnExpressionEnd === undefined) continue;
			if (styleBlock.pos >= functionBlock.returnExpressionPos && styleBlock.pos <= functionBlock.returnExpressionEnd) {
				styleBlock.inline = true;
				// Inline styles do *not* get assigned to a function, so reset it here
				owningFunctionBlock = undefined;
				break;
			}
		}

		if (!styleBlock.inline && styleBlock.global) {
			globalStyleBlocks.push(styleBlock);
		} else
		if (!styleBlock.inline) {
			if (owningFunctionBlock) {

				if (styleBlock.slotName !== undefined) {
					// Store style in function slot styles
					const functionSlotStyleBlocks = getOrCreateMapEntry(functionSlotStyleBlocksMap, owningFunctionBlock, () => []);
					functionSlotStyleBlocks.push(styleBlock);
				} else {
					// Store style in function
					const functionStyleBlocks = getOrCreateMapEntry(functionStyleBlocksMap, owningFunctionBlock, () => []);
					functionStyleBlocks.push(styleBlock);
				}
			} else {
				// Store style in module
				moduleStyleBlocks.push(styleBlock);
			}
		}
	}

	// Merge multiple global styles into one
	const globalStyleBlock = combineStyleBlocks(globalStyleBlocks);
	if (globalStyleBlock) {
		createPreprocessedGlobalStyle(srcFilePath, globalStyleBlock);
	}

	// Merge multiple module-level styles into one
	const moduleStyleBlock = combineStyleBlocks(moduleStyleBlocks);
	if (moduleStyleBlock) {
		createPreprocessedModuleStyle(srcFilePath, moduleStyleBlock);
	}

	// Merge multiple function-level styles into one (per function)
	for (const functionBlock of functionStyleBlocksMap.keys()) {
		const functionStyleBlock = combineStyleBlocks(functionStyleBlocksMap.get(functionBlock)!);
		if (functionStyleBlock) {
			createPreprocessedFunctionStyle(functionBlock.functionId, functionStyleBlock);
		}
	}

	// Create function slot styles
	for (const [functionBlock, slotStyleBlocks] of functionSlotStyleBlocksMap.entries()) {
		for (const slotStyleBlock of slotStyleBlocks) {
			const functionStyleBlock = combineStyleBlocks([slotStyleBlock]);
			if (functionStyleBlock) {
				createPreprocessedFunctionSlotStyle(functionBlock.functionId, slotStyleBlock.slotName!, functionStyleBlock);
			}
		}
	}
}

/**
 * Combines the given styles so that each style is at the same location as it was in the original file.
 * Everything between styles is whitespace only (including newline, tabs, ...);
 * We do this to get correct error linenumbers.
 */
function combineStyleBlocks(styleBlocks: StyleBlock[]): CombinedStyleBlock | undefined {
	if (styleBlocks.length === 0) return undefined;
	let combinedCss = "";
	const tsBlocks: StyleTsBlock[] = [];
	for (let i = 0; i < styleBlocks.length; ++i) {
		const styleBlock = styleBlocks[i];
		if (styleBlock.content.length) {
			const pos = combinedCss.length;
			// Each style's contentFull is whitespace from the begin of the file plus the style content
			combinedCss += styleBlock.contentFull.substring(pos);
			tsBlocks.push(...styleBlock.tsBlocks);
		}
	}

	return {
		styleId: styleBlocks[0].styleId,
		fixedId: styleBlocks[0].fixedId,
		attributes: styleBlocks[0].attributes,
		css: combinedCss,
		tsBlocks,
	};
}

export function styleBlockToSourceCode(srcCode: string, styleBlock: StyleBlock) {
	if (styleBlock.inline) {
		return inlineStyleBlockToSourceCode(srcCode, styleBlock);
	} else
	if (styleBlock.global) {
		return globalStyleBlockToSourceCode(srcCode, styleBlock);
	} else {
		return scopedStyleBlockToSourceCode(srcCode, styleBlock);
	}
}

function inlineStyleBlockToSourceCode(srcCode: string, styleBlock: StyleBlock) {
	let content = srcCode.substring(styleBlock.contentPos, styleBlock.contentEnd);
	const trimmed = content.trim();
	if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
		// We have a style with JSX syntax <style>{`...`}</style>
		// Just return the complete original block including <style> and </style>
		return srcCode.substring(styleBlock.pos, styleBlock.end);
	} else {
		// We have a style with non JSX syntax <style>...</style>

		// Unwrap {`...`} blocks that are inside content
		content = unwrapInlineStyleContent(content);

		// Wrap the content in {`...`} and return <style>{`...`}</style>
		return `<style>{\`${content}\`}</style>`;
	}
}

function globalStyleBlockToSourceCode(srcCode: string, styleBlock: StyleBlock) {
	// Return the style ID tag and new lines
	const nNewLines = countNewLines(srcCode, styleBlock.pos, styleBlock.end);
	const styleId = styleBlock.styleId;
	return `/*${STYLE_ID_START_TAG}${styleId}${STYLE_ID_END_TAG}${"\n".repeat(nNewLines)}*/`;
}

function scopedStyleBlockToSourceCode(srcCode: string, styleBlock: StyleBlock) {
	// Return the style ID tag and new lines
	const nNewLines = countNewLines(srcCode, styleBlock.pos, styleBlock.end);
	const styleId = styleBlock.styleId;
	return `/*${STYLE_ID_START_TAG}${styleId}${STYLE_ID_END_TAG}${"\n".repeat(nNewLines)}*/`;
}

function countNewLines(srcCode: string, start: number, end: number) {
	let n = 0;
	for (let pos = start; pos < end; ++pos) {
		if (srcCode[pos] === "\n") ++n;
	}
	return n;
}

/** Remove (not just replace) {` and `} */
function unwrapInlineStyleContent(content: string) {
	content = content.replace(/{\s*?`/gm, "");
	content = content.replace(/`\s*?}/gm, "");
	return content;
}
