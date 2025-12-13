import * as ts from "typescript";
import { uuid } from "../../util/uuid.js";
import { createPreprocessedFunction } from "./preprocess-registry.js";
import { FUNCTION_ID_END_TAG, FUNCTION_ID_START_TAG, type FunctionBlock } from "./types.js";

export function extractFunctionBlocks(srcFilePath: string, sourceCode: string): FunctionBlock[] {
	const sourceFile = ts.createSourceFile(
		'temp.tsx',
		sourceCode,
		ts.ScriptTarget.Latest,
		true
	);

	const functionBlocks: FunctionBlock[] = [];

	function visit(node: ts.Node) {
		let bodyNode: ts.Node | undefined;
		let kind = '';
		let name: string | undefined;
		// let parentNode: ts.Node | undefined;

		// Check different function types
		if (ts.isFunctionDeclaration(node)) {
			bodyNode = node.body;
			kind = 'FunctionDeclaration';
			name = node.name?.text;
			// parentNode = node.parent;
		} else if (ts.isFunctionExpression(node)) {
			bodyNode = node.body;
			kind = 'FunctionExpression';
			name = node.name?.text;
			// parentNode = node.parent;
		} else if (ts.isArrowFunction(node)) {
			bodyNode = node.body;
			kind = 'ArrowFunction';
			// parentNode = node.parent;
			// Arrow functions in variable declarations
			if (ts.isVariableDeclaration(node.parent)) {
				name = node.parent.name.getText(sourceFile);
				// parentNode = node.parent.parent;
			}
		} else if (ts.isMethodDeclaration(node)) {
			bodyNode = node.body;
			kind = 'MethodDeclaration';
			name = node.name.getText(sourceFile);
			// parentNode = node.parent;
		} else if (ts.isConstructorDeclaration(node)) {
			bodyNode = node.body;
			kind = 'Constructor';
			name = 'constructor';
			// parentNode = node.parent;
		} else if (ts.isGetAccessorDeclaration(node)) {
			bodyNode = node.body;
			kind = 'GetAccessor';
			name = node.name.getText(sourceFile);
			// parentNode = node.parent;
		} else if (ts.isSetAccessorDeclaration(node)) {
			bodyNode = node.body;
			kind = 'SetAccessor';
			name = node.name.getText(sourceFile);
			// parentNode = node.parent;
		}

		// If we found a body that's a block (has braces)
		if (bodyNode && ts.isBlock(bodyNode)) {
			const funcFullText = node.getFullText();
			const funcFullStart = node.getFullStart();
			const funcFullEnd = funcFullStart + funcFullText.length;

			// Use the block's full text to get exact brace positions
			const bodyFullText = bodyNode.getFullText(sourceFile);
			const bodyFullStart = bodyNode.getFullStart();

			// The opening brace is the first character of the full text
			const bodyPos = bodyFullStart + bodyFullText.indexOf('{');

			// The closing brace is the last '}' in the full text
			const bodyEnd = bodyFullStart + bodyFullText.lastIndexOf('}') + 1;

			const functionBlock: FunctionBlock = {
				functionId: uuid(),
				pos: funcFullStart,
				end: funcFullEnd,
				txt: funcFullText,
				bodyPos,
				bodyEnd,
				bodyTxt: bodyFullText.substring(bodyPos - bodyFullStart),
				kind,
				name: name || "",

				bodyNode: bodyNode,
				// parentNode: parentNode!,

				parent: undefined,
				children: [],

				nestingDepth: 0,
			};

			functionBlocks.push(functionBlock);

			storeJsxReturnExpressionWrappingOfFunctionBody(functionBlock);
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	// Init function tree structure
	treeifyFunctionBlocks(functionBlocks);

	// Register preprocessed functions
	for (const functionBlock of functionBlocks) {
		createPreprocessedFunction(srcFilePath, functionBlock);
	}

	return functionBlocks;
}

let currentFunctionBlock: FunctionBlock;
function storeJsxReturnExpressionWrappingOfFunctionBody(functionBlock: FunctionBlock) {
	currentFunctionBlock = functionBlock;
	ts.forEachChild(functionBlock.bodyNode, storeJsxReturnExpressionWrapping);
}

/**
 * Helper function to get rid of "JSX expressions must have one parent element.ts(2657)"
 * This function checks if a function's return expression is a candidate for our auto-wrapping.
 * Expressions like <div></div><div></div> and (<div></div><div></div>) are *not* recognized
 * as JSX expressions. If we find such an expression, we check if the expression has at least
 * one child and if that child is a JSX expression. If so, then we know we have an expression
 * that triggers the 2657 and we store the source code positions where we insert the <> and </>
 * These positions are
 * - at the start/end of <div></div><div></div>
 * - inside the () of (<div></div><div></div>)
 *
 * @param node The function body node
 */
function storeJsxReturnExpressionWrapping(node: ts.Node) {
	if (ts.isReturnStatement(node) && node.expression) {
		currentFunctionBlock.returnExpressionPos = node.expression.getStart();
		currentFunctionBlock.returnExpressionEnd = node.expression.getEnd();
		const inner = unwrapParens(node.expression)
		if (!isJsxExpression(inner)) {
			if (inner.getChildCount() && isJsxExpression(inner.getChildAt(0))) {
				// console.log("WE WILL WRAP THIS CODE IN A FRAGMENT:");
				// const s = inner.getSourceFile().text.substring(inner.getStart(), inner.getEnd());
				// console.log(`'${s}'`);

				currentFunctionBlock.fragmentOpenTagInsertPos = inner.getStart();
				currentFunctionBlock.fragmentCloseTagInsertPos = inner.getEnd();
			}
		}

		// return statement found, stop iteration
		return true;
	}
}

function isJsxExpression(node: ts.Node) {
	if (!ts.isExpression(node)) return false;
	const inner = unwrapParens(node);
	return (
		ts.isJsxElement(inner) ||
		ts.isJsxSelfClosingElement(inner) ||
		ts.isJsxFragment(inner)
	);
}

function unwrapParens(expr: ts.Expression): ts.Expression {
	while (ts.isParenthesizedExpression(expr)) expr = expr.expression;
	return expr;
}

function treeifyFunctionBlocks(functionBlocks: FunctionBlock[]) {
	const map = new Map<ts.Node, FunctionBlock>();
	for (const functionBlock of functionBlocks) {
		map.set(functionBlock.bodyNode, functionBlock);
	}

	function findParent(node: ts.Node) {
		if (!node) return undefined;
		const functionBlock = map.get(node);
		if (functionBlock) return functionBlock;
		return findParent(node.parent);
	}

	for (const functionBlock of functionBlocks) {
		functionBlock.parent = findParent(functionBlock.bodyNode.parent);
		if (functionBlock.parent) {
			functionBlock.nestingDepth = functionBlock.parent.nestingDepth + 1;
			functionBlock.parent.children.push(functionBlock);
		} else {
			functionBlock.nestingDepth = 0;
		}
	}
}

export function functionBlockToSourceCode(srcCode: string, functionBlock: FunctionBlock) {
	// Note that we have to write *actual code* after the function body brace.
	// A comment does not work here because it would get removed and
	// React.createElement() would not get a function ID to parse!
	const functionId = functionBlock.functionId;
	const functionTag = `const __FID__ = "${FUNCTION_ID_START_TAG}${functionId}${FUNCTION_ID_END_TAG}";`;
	return functionTag;
}

export function functionBlockFragmentOpenTagToSourceCode(srcCode: string, functionBlock: FunctionBlock) {
	if (functionBlock.fragmentOpenTagInsertPos !== undefined) {
		return "<>";
	}
	return "";
}

export function functionBlockFragmentCloseTagToSourceCode(srcCode: string, functionBlock: FunctionBlock) {
	if (functionBlock.fragmentCloseTagInsertPos !== undefined) {
		return "</>";
	}
	return "";
}

export function dumpFunctionTree(functionBlocks: FunctionBlock[]) {
	for (const functionBlock of functionBlocks) {
		if (!functionBlock.parent) {
			dumpFunctionTreeNode(functionBlock);
		}
	}
}

function dumpFunctionTreeNode(functionBlock: FunctionBlock, indent = 0) {
	console.log(`${" ".repeat(indent * 2)}${functionBlock.name}`);
	for (const child of functionBlock.children) {
		dumpFunctionTreeNode(child, indent + 1);
	}
}
