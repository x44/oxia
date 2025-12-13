import { Diagnostic, LanguageServiceContext, LanguageServicePlugin, TextEdit } from "@volar/language-service";
import { create as createTypeScriptServices } from 'volar-service-typescript';
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentMetas } from "./document-meta.js";
import { modifyDocumentDiagnostics, modifyDocumentFormattingEdits } from "./document-util.js";

export function create(typescript: typeof import("typescript")): LanguageServicePlugin[] {
	const tsServices = createTypeScriptServices(typescript);

	for (const tsService of tsServices) {
		const originalCreate = tsService.create;

		tsService.create = (context: LanguageServiceContext) => {
			const originalService = originalCreate(context);

			const originalProvideDocumentFormattingEdits = originalService.provideDocumentFormattingEdits;
			if (originalProvideDocumentFormattingEdits) {
				originalService.provideDocumentFormattingEdits = (document, range, options, embeddedCodeContext, token) => {
					const originalEdits = originalProvideDocumentFormattingEdits?.(document, range, options, embeddedCodeContext, token);
					return modifyDocumentFormattingEdits(document, originalEdits, modifyFormattingEdits);
				}
			}

			const originalProvideOnTypeDocumentFormattingEdits = originalService.provideOnTypeFormattingEdits;
			if (originalProvideOnTypeDocumentFormattingEdits) {
				originalService.provideOnTypeFormattingEdits = (document, position, key, options, embeddedCodeContext, token) => {
					const originalEdits = originalProvideOnTypeDocumentFormattingEdits?.(document, position, key, options, embeddedCodeContext, token);
					return modifyDocumentFormattingEdits(document, originalEdits, modifyFormattingEdits);
				}
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
	}

	return tsServices;
}

function modifyFormattingEdits(document: TextDocument, originalEdits: TextEdit[] | null | undefined) {
	if (!originalEdits) return originalEdits;

	const fileId = DocumentMetas.uri2fileId(document.uri);

	return originalEdits.filter(edit => {
		const offset = document.offsetAt(edit.range.start);
		if (DocumentMetas.isOffsetInStyleBlockRange(fileId, offset)) return false;

		// Avoid invalid indentation of <style>
		if (DocumentMetas.isOffsetAtStyleBlockStart(fileId, offset)) return false;

		return true;
	});
}

function modifyDiagnostics(document: TextDocument, originalDiagnostics: Diagnostic[] | null | undefined) {
	if (!originalDiagnostics) return originalDiagnostics;

	const fileId = DocumentMetas.uri2fileId(document.uri);

	return originalDiagnostics.filter(diagnostic => {

		// Suppress: JSX expressions must have one parent element.ts(2657)
		if (diagnostic.code === 2657) return false;

		// Suppress: Unreachable code detected.ts(7027) for <style></style>
		if (diagnostic.code === 7027) {
			const offset = document.offsetAt(diagnostic.range.start);
			if (DocumentMetas.isOffsetInStyleBlockRange(fileId, offset)) return false;
		}

		return true;
	});
}
