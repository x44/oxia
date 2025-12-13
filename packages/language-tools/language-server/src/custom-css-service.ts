import { Diagnostic, LanguageServiceContext, LanguageServicePlugin, TextEdit } from "@volar/language-service";
import { create as createCssService } from 'volar-service-css';
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentMetas } from "./document-meta.js";
import { modifyDocumentDiagnostics, modifyDocumentFormattingEdits } from "./document-util.js";

export function create(): LanguageServicePlugin {
	const cssService = createCssService();

	const originalCreate = cssService.create;

	cssService.create = (context: LanguageServiceContext) => {
		const originalService = originalCreate(context);

		const originalProvideDocumentFormattingEdits = originalService.provideDocumentFormattingEdits;
		const originalProvideOnTypeDocumentFormattingEdits = originalService.provideOnTypeFormattingEdits;

		originalService.provideDocumentFormattingEdits = (document, range, options, embeddedCodeContext, token) => {
			const originalEdits = originalProvideDocumentFormattingEdits?.(document, range, options, embeddedCodeContext, token);
			return modifyDocumentFormattingEdits(document, originalEdits, modifyFormattingEdits);
		}

		originalService.provideOnTypeFormattingEdits = (document, position, key, options, embeddedCodeContext, token) => {
			const originalEdits = originalProvideOnTypeDocumentFormattingEdits?.(document, position, key, options, embeddedCodeContext, token);
			return modifyDocumentFormattingEdits(document, originalEdits, modifyFormattingEdits);
		}

		const originalProvideDiagnostics = originalService.provideDiagnostics
		if (originalProvideDiagnostics) {
			originalService.provideDiagnostics = (document, token) => {
				const originalDiagnostics = originalProvideDiagnostics(document, token);
				return modifyDocumentDiagnostics(document, originalDiagnostics, modifyDiagnostics);
			}
		}

		return originalService;
	}

	return cssService;
}

function modifyFormattingEdits(document: TextDocument, originalEdits: TextEdit[] | null | undefined) {
	if (!originalEdits) return originalEdits;

	const fileId = DocumentMetas.uri2fileId(document.uri);

	return originalEdits.map(edit => ({
		range: edit.range,
		newText: formatCss(fileId, document.offsetAt(edit.range.start), edit.newText)
	}));
}

function formatCss(fileId: string, offset: number, cssText: string): string {
	// Trim end only, to not move the first line up and it ends after <style>...
	cssText = cssText.trimEnd();

	if (DocumentMetas.hasCssCurlyPositions(fileId)) {
		let tmpText = "";
		let pos = 0;
		let copyPos = pos;
		const len = tmpText.length;
		while (pos < len) {
			const quotePos = tmpText.indexOf('"', pos);
			if (quotePos === -1) break;

			if (DocumentMetas.isOffsetAtCssCurlyOpenPosition(fileId, offset + pos)) {
				tmpText += cssText.substring(copyPos, quotePos);
				tmpText += "{";
				pos = quotePos + 1;
				copyPos = pos;
			} else
			if (DocumentMetas.isOffsetAtCssCurlyClosePosition(fileId, offset + pos)) {
				tmpText += cssText.substring(copyPos, quotePos);
				tmpText += "}";
				pos = quotePos + 1;
				copyPos = pos;
			} else {
				++pos;
			}
		}

		tmpText += cssText.substring(copyPos);
		cssText = tmpText;
	}

	// Restore the original {`...`} property values.
	// Original code: color: {`...`};
	// Modified code: color: "`...`";
	// The modified code is there to make the CSS syntax checker happy.
	// When formatting (the modified code) we must return the original code.
	cssText = cssText.replaceAll('"`', '{`');
	cssText = cssText.replaceAll('`"', '`}');

	return cssText;
}

function modifyDiagnostics(document: TextDocument, originalDiagnostics: Diagnostic[] | null | undefined) {
	return originalDiagnostics;
	// if (!originalDiagnostics) return originalDiagnostics;

	// const fileId = DocumentMetas.uri2fileId(document.uri);

	// return originalDiagnostics.filter(diagnostic => {
	// 	return true;
	// });
}
