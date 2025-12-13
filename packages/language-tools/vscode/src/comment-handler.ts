import * as vscode from 'vscode';
import { extractJsxSections } from './comment-jsx-parser.js';
import { extractStyleSections } from './comment-style-parser.js';

// OXIA                     VSCODE                             COMMAND                 KEYBINDING
// ---------------------------------------------------------------------------------------------------
// oxia.commentLine          editor.action.commentLine          Toggle Line Comment     CTRL + #
// oxia.blockComment         editor.action.blockComment         Toggle Block Comment    SHIFT + ALT + A
// oxia.addCommentLine       editor.action.addCommentLine       Add Line Comment        CTRL + K CTRL + C
// oxia.removeCommentLine    editor.action.removeCommentLine    Remove Line Comment     CTRL + K CTRL + U

function isInJsx(document: vscode.TextDocument, selection: vscode.Selection) {
	const text = document.getText();
	const start = document.offsetAt(selection.start);
	const startNonWhite = nonWhitespacePos(text, start);
	if (startNonWhite === -1) return false;

	const [noCommentsEmptyStringsNoStyles, styleSections] = extractStyleSections(text);

	for (const styleSection of styleSections) {
		if (startNonWhite >= styleSection.start && startNonWhite < styleSection.end) {
			return false;
		}
	}

	// Check if we are in a JSX return expression
	const jsxSections = extractJsxSections(noCommentsEmptyStringsNoStyles);

	for (const jsxSection of jsxSections) {
		if (startNonWhite >= jsxSection.start && startNonWhite < jsxSection.end) {
			return true;
		}
	}

	return false;
}

function getEditor() {
	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.document.languageId !== 'oxia') {
		return undefined;
	}
	return editor;
}

export async function toggleLineComment() {
	const editor = getEditor();
	if (!editor) return;
	const document = editor.document;
	const selections = editor.selections;

	await editor.edit(editBuilder => {
		for (const selection of selections) {
			if (!isInJsx(document, selection)) {
				vscode.commands.executeCommand("editor.action.commentLine");
			} else {
				jsxToggleLineComment(editBuilder, document, selection);
			}
		}
	});
}

export async function toggleBlockComment() {
	const editor = getEditor();
	if (!editor) return;
	const document = editor.document;
	const selections = editor.selections;
	await editor.edit(editBuilder => {
		for (const selection of selections) {
			if (!isInJsx(document, selection)) {
				vscode.commands.executeCommand("editor.action.blockComment");
			} else {
				jsxToggleBlockComment(editBuilder, document, selection);
			}
		}
	});
}

export async function addLineComment() {
	const editor = getEditor();
	if (!editor) return;
	const document = editor.document;
	const selections = editor.selections;
	await editor.edit(editBuilder => {
		for (const selection of selections) {
			if (!isInJsx(document, selection)) {
				vscode.commands.executeCommand("editor.action.addCommentLine");
			} else {
				jsxAddLineComment(editBuilder, document, selection);
			}
		}
	});
}

export async function removeLineComment() {
	const editor = getEditor();
	if (!editor) return;
	const document = editor.document;
	const selections = editor.selections;
	await editor.edit(editBuilder => {
		for (const selection of selections) {
			if (!isInJsx(document, selection)) {
				vscode.commands.executeCommand("editor.action.removeCommentLine");
			} else {
				jsxRemoveLineComment(editBuilder, document, selection);
			}
		}
	});
}

function jsxAddLineComment(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument, selection: vscode.Selection) {
	const lineNumbers = getSelectionLineNumbers(document, selection);

	let indentCharacters = 0;
	if (true) {
		indentCharacters = Number.POSITIVE_INFINITY;
		for (const lineNumber of lineNumbers) {
			const line = document.lineAt(lineNumber);
			const lineIndentCharacters = line.firstNonWhitespaceCharacterIndex;
			indentCharacters = Math.min(indentCharacters, lineIndentCharacters);
		}
	}

	for (const lineNumber of lineNumbers) {
		const line = document.lineAt(lineNumber);
		const text = line.text;
		if (text.trim().startsWith("{/*")) continue;
		const lineStart = line.range.start;
		const lineEnd = line.range.end;
		editBuilder.insert(lineStart.translate(0, indentCharacters), "{/* ");
		editBuilder.insert(lineEnd, " */}");
	}
}

function jsxRemoveLineComment(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument, selection: vscode.Selection) {
	const lineNumbers = getSelectionLineNumbers(document, selection);

	for (const lineNumber of lineNumbers) {
		const line = document.lineAt(lineNumber);
		const text = line.text;
		const lineOffset = document.offsetAt(line.range.start);
		const commentStartPos = text.indexOf("{/*");
		if (commentStartPos !== -1) {
			jsxRemoveCommentStart(editBuilder, document, lineOffset + commentStartPos);
		}

		const commentEndPos = text.lastIndexOf("*/}");
		if (commentEndPos !== -1) {
			jsxRemoveCommentEnd(editBuilder, document, lineOffset + commentEndPos);
		}
	}
}

function jsxToggleLineComment(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument, selection: vscode.Selection) {
	const lineNumbers = getSelectionLineNumbers(document, selection);

	let allLinesCommented = true
	for (const lineNumber of lineNumbers) {
		const line = document.lineAt(lineNumber);
		const text = line.text;
		if (!text.trim().startsWith("{/*")) {
			allLinesCommented = false;
			break;
		}
	}

	if (!allLinesCommented) {
		jsxAddLineComment(editBuilder, document, selection);
	} else {
		jsxRemoveLineComment(editBuilder, document, selection);
	}
}

function jsxToggleBlockComment(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument, selection: vscode.Selection) {
	const text = document.getText();

	// Check if cursor is inside {/* */} and if so remove the surrounding comment
	const cursor = document.offsetAt(selection.active);
	const commentStartPos = text.lastIndexOf("{/*", cursor);
	if (commentStartPos !== -1) {
		// Check that we are not after a */} and incorrectly use the {/* of it
		// {/*...*/} | cursor We must not use the left {/*
		const prevCommentEndPos = text.lastIndexOf("*/}", cursor - 1);
		if (prevCommentEndPos < commentStartPos) {
			const commentEndPos = text.indexOf("*/}", cursor);
			// Check that we are not before a {/* and incorrectly use the */} of it
			// cursor | {/*...*/} We must not use the right */}
			const nextCommentStartPos = text.indexOf("{/*", cursor + 1);
			if (commentEndPos > commentStartPos && (nextCommentStartPos === -1 || nextCommentStartPos > commentEndPos)) {
				jsxRemoveComment(editBuilder, document, commentStartPos, commentEndPos);
				return;
			}
		}
	}

	// Check if the trimmed selected text starts/ends with {/* */} and if so remove the {*/ and */}
	const selStart = document.offsetAt(selection.start);
	const selEnd = document.offsetAt(selection.end);
	const selText = text.substring(selStart, selEnd);
	const selTextTrimmed = selText.trim();
	if (selTextTrimmed.startsWith("{/*") && selTextTrimmed.endsWith("*/}")) {
		const commentStartPos = text.indexOf("{/*", selStart);
		const commentEndPos = text.lastIndexOf("*/}", selEnd);
		jsxRemoveComment(editBuilder, document, commentStartPos, commentEndPos);
		return;
	}

	// Surroung the selected text with {*/ and */}
	editBuilder.insert(selection.start, "{/* ");
	editBuilder.insert(selection.end, " */}");
}

function jsxRemoveComment(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument, commentStartPos: number, commentEndPos: number) {
	jsxRemoveCommentStart(editBuilder, document, commentStartPos);
	jsxRemoveCommentEnd(editBuilder, document, commentEndPos);
}

function jsxRemoveCommentStart(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument, pos: number) {
	const text = document.getText();
	const deleteLength = text.charAt(pos + 3) === " " ? 4 : 3;
	const deleteStart = document.positionAt(pos);
	const deleteEnd = document.positionAt(pos + deleteLength);
	const deleteRange = new vscode.Range(deleteStart, deleteEnd);
	editBuilder.delete(deleteRange);
}

function jsxRemoveCommentEnd(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument, pos: number) {
	const text = document.getText();
	const deleteLength = text.charAt(pos - 1) === " " ? 4 : 3;
	const deleteOffset = deleteLength === 4 ? 1 : 0;
	const deleteStart = document.positionAt(pos - deleteOffset);
	const deleteEnd = document.positionAt(pos - deleteOffset + deleteLength);
	const deleteRange = new vscode.Range(deleteStart, deleteEnd);
	editBuilder.delete(deleteRange);
}

function getSelectionLineNumbers(document: vscode.TextDocument, selection: vscode.Selection, includeEmpty = false) {
	if (selection.isSingleLine) return [selection.start.line];
	const lineNumbers = [];
	const start = selection.start.line;
	const end = selection.end.character > 0 ? selection.end.line : selection.end.line - 1;
	for (let lineNumber = start; lineNumber <= end; ++lineNumber) {
		if (!includeEmpty) {
			const line = document.lineAt(lineNumber);
			if (line.isEmptyOrWhitespace) continue;
		}
		lineNumbers.push(lineNumber);
	}
	return lineNumbers;
}

function nonWhitespacePos(s: string, pos: number) {
	const len = s.length;
	while (pos < len) {
		const c = s.charAt(pos);
		if (c !== "\t" && c !== "\r" && c !== "\n" && c !== " ") return pos;
		++pos;
	}
	return -1;
}
