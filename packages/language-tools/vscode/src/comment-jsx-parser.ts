import * as ts from "typescript";

export type JsxSection = {
	start: number;
	end: number;
}

export function extractJsxSections(sourceCode: string): JsxSection[] {
	const sourceFile = ts.createSourceFile(
		'temp.tsx',
		sourceCode,
		ts.ScriptTarget.Latest,
		true
	);

	const jsxSections: JsxSection[] = [];

	function visit(node: ts.Node) {
		let bodyNode: ts.Node | undefined;

		if (ts.isFunctionDeclaration(node)) {
			bodyNode = node.body;
		} else if (ts.isFunctionExpression(node)) {
			bodyNode = node.body;
		} else if (ts.isArrowFunction(node)) {
			bodyNode = node.body;
		} else if (ts.isMethodDeclaration(node)) {
			bodyNode = node.body;
		} else if (ts.isConstructorDeclaration(node)) {
			bodyNode = node.body;
		} else if (ts.isGetAccessorDeclaration(node)) {
			bodyNode = node.body;
		} else if (ts.isSetAccessorDeclaration(node)) {
			bodyNode = node.body;
		}

		// If we found a body that's a block (has braces)
		if (bodyNode && ts.isBlock(bodyNode)) {

			function visitFunctionBody(node: ts.Node) {
				if (ts.isReturnStatement(node) && node.expression) {
					let isJsx = true;
					const inner = unwrapParens(node.expression)
					if (!isJsxExpression(inner)) {
						// Here we handle our auto-wrapping of multiple JSX elements
						if (inner.getChildCount() && isJsxExpression(inner.getChildAt(0))) {
							isJsx = true;
						}
					} else {
						isJsx = true;
					}

					if (isJsx) {
						jsxSections.push({
							start: node.expression.getStart(),
							end: node.expression.getEnd(),
						});
					}

					// return statement found, stop iteration
					return true;
				}
			}

			ts.forEachChild(bodyNode, visitFunctionBody);
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return jsxSections;
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
