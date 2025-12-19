import { Log } from "../../util/log.js";
import { Timings } from "../../util/timings.js";
import { extractFunctionBlocks, functionBlockFragmentCloseTagToSourceCode, functionBlockFragmentOpenTagToSourceCode, functionBlockToSourceCode } from "./functions.js";
import { createModule, deleteModule } from "./module-registry.js";
import { createPreprocessedModule, deletePreprocessedModule, getPreprocessedModule, treeifyPreprocessedStyles } from "./preprocess-registry.js";
import { extractStyleBlocks, hideStyleBlocks, processStyleBlocks, styleBlockToSourceCode } from "./styles.js";
import { SET_STYLE_RESULT_FUNCTION, type FunctionBlock, type StyleBlock } from "./types.js";

export function oxia2tsx(oxiaAbsPath: string, srcCode: string) {
	Log.debug(`oxia2tsx ${oxiaAbsPath}`);

	Timings.begin("oxia2tsx");

	const srcFilePath = oxiaAbsPath;

	deletePreprocessedModule(srcFilePath);
	createPreprocessedModule(srcFilePath);

	const styleBlocks = extractStyleBlocks(srcCode);

	// Hide style blocks from ts parser, so we get the actual function return expressions
	const srcCodeWithoutStyles = hideStyleBlocks(srcCode, styleBlocks);

	// Extract and treeify function blocks
	const functionBlocks = extractFunctionBlocks(srcFilePath, srcCodeWithoutStyles);

	// Mark style blocks that are inside of a function return expression as "inline"
	processStyleBlocks(srcFilePath, styleBlocks, functionBlocks);

	// Create the style hierarchy
	treeifyPreprocessedStyles(srcFilePath);

	// Create ModuleInfo, FunctionInfo, StyleInfo, SlotStyleInfo - Used in rewriteBlocks()!
	deleteModule(srcFilePath);
	createModule(getPreprocessedModule(srcFilePath));

	// Finally rewrite the source code
	srcCode = rewriteBlocks(srcCode, styleBlocks, functionBlocks);

	// Log.log("---------------------------------------------------------------");
	// Log.log(srcCode);
	// Log.log("---------------------------------------------------------------");

	// dumpModule(srcFilePath);

	Timings.end();

	return srcCode;
}

type Block = {
	pos: number;
	end: number;
	toSrcCode: () => string;
}

function rewriteBlocks(srcCode: string, styleBlocks: StyleBlock[], functionBlocks: FunctionBlock[]) {
	let out = "";
	// Merge style and function blocks to a position-sorted array

	const blocks: Block[] = [];

	for (const styleBlock of styleBlocks) {
		blocks.push({
			pos: styleBlock.pos,
			end: styleBlock.end,
			toSrcCode: () => { return styleBlockToSourceCode(srcCode, styleBlock); },
		});
	}

	for (const functionBlock of functionBlocks) {
		// Function ID
		blocks.push({
			pos: functionBlock.bodyPos + 1, // Skip body opening brace
			end: functionBlock.bodyPos + 1, // We do not write the body!
			toSrcCode: () => { return functionBlockToSourceCode(srcCode, functionBlock); },
		});

		// Auto-insert fragment open tag
		if (functionBlock.fragmentOpenTagInsertPos !== undefined) {
			blocks.push({
				pos: functionBlock.fragmentOpenTagInsertPos,
				end: functionBlock.fragmentOpenTagInsertPos,
				toSrcCode: () => { return functionBlockFragmentOpenTagToSourceCode(srcCode, functionBlock); },
			});
		}

		// Auto-insert fragment close tag
		if (functionBlock.fragmentCloseTagInsertPos !== undefined) {
			blocks.push({
				pos: functionBlock.fragmentCloseTagInsertPos,
				end: functionBlock.fragmentCloseTagInsertPos,
				toSrcCode: () => { return functionBlockFragmentCloseTagToSourceCode(srcCode, functionBlock); },
			});
		}
	}

	blocks.sort((a, b) => a.pos - b.pos);

	let pos = 0;
	for (let i = 0; i < blocks.length; ++i) {
		const block = blocks[i];
		out += srcCode.substring(pos, block.pos);

		out += block.toSrcCode();

		pos = block.end;
	}

	out += srcCode.substring(pos);

	// Append style TS blocks
	out += tsBlocksToSourceCode(styleBlocks);

	return out;
}

function tsBlocksToSourceCode(styleBlocks: StyleBlock[]) {
	let out = "";
	for (const styleBlock of styleBlocks) {
		for (const tsBlock of styleBlock.tsBlocks) {
			const id = tsBlock.id;
			const code = tsBlock.code;
			const injectedCode = `\n${SET_STYLE_RESULT_FUNCTION}("${id}", ${code});`;
			out += injectedCode;
		}
	}
	return out;
}
