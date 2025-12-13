import { Diagnostic, NullableProviderResult, TextEdit } from "@volar/language-service";
import { TextDocument } from "vscode-languageserver-textdocument";

export function modifyDocumentFormattingEdits(document: TextDocument, originalEdits: NullableProviderResult<TextEdit[]>, handler: (document: TextDocument, edits: TextEdit[] | null | undefined) => TextEdit[] | null | undefined):  NullableProviderResult<TextEdit[]> {
	if (!originalEdits) return undefined;

	if (originalEdits instanceof Promise) {
		const promise = originalEdits as Promise<TextEdit[] | null | undefined>;
		return promise.then(edits => {
			return handler(document, edits);
		});
	} else {
		return handler(document, originalEdits as TextEdit[]);
	}
}

export function modifyDocumentDiagnostics(document: TextDocument, originalDiagnostics: NullableProviderResult<Diagnostic[]>, handler: (document: TextDocument, diagnostics: Diagnostic[] | null | undefined) => Diagnostic[] | null | undefined):  NullableProviderResult<Diagnostic[]> {
	if (!originalDiagnostics) return undefined;

	if (originalDiagnostics instanceof Promise) {
		const promise = originalDiagnostics as Promise<Diagnostic[] | null | undefined>;
		return promise.then(diagnostics => {
			return handler(document, diagnostics);
		});
	} else {
		return handler(document, originalDiagnostics as Diagnostic[]);
	}
}
