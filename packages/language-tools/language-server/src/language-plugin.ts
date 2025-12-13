import { LanguagePlugin } from '@volar/language-core';
import { TypeScriptExtraServiceScript } from '@volar/typescript';
import ts from 'typescript';
import { URI } from 'vscode-uri';
import { parseOxiaFile } from './oxia-file.js';

export function createOxiaLanguagePlugin(): LanguagePlugin<URI> {
	return {

		getLanguageId(uri) {
			if (uri.path.endsWith('.oxia')) {
				return 'oxia';
			}
		},

		createVirtualCode(uri, languageId, snapshot) {
			if (languageId === 'oxia') {
				return parseOxiaFile(uri.fsPath, snapshot);
			}
		},

		typescript: {
			extraFileExtensions: [{ extension: 'oxia', isMixedContent: true, scriptKind: 7 satisfies ts.ScriptKind.Deferred }],
			getServiceScript(root) {
				return {
					code: root,
					extension: ".tsx",
					scriptKind: 4 satisfies ts.ScriptKind.TSX
				};
			},
			getExtraServiceScripts(fileName, root) {
				const scripts: TypeScriptExtraServiceScript[] = [];
				return scripts;
			}
		}

	};
}

export default createOxiaLanguagePlugin;
