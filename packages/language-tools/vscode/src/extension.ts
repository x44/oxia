import * as serverProtocol from "@volar/language-server/protocol";
import { activateAutoInsertion, createLabsInfo } from "@volar/vscode";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as lsp from "vscode-languageclient/node";
import { addLineComment, removeLineComment, toggleBlockComment, toggleLineComment } from "./comment-handler";

export async function activate(context: vscode.ExtensionContext) {
	const serverModule = context.asAbsolutePath(
		path.join("dist", "server.js")
	);

	const runOptions = { execArgv: [] };
	const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

	const serverOptions: lsp.ServerOptions = {
		run: { module: serverModule, transport: lsp.TransportKind.ipc, options: runOptions },
		debug: { module: serverModule, transport: lsp.TransportKind.ipc, options: debugOptions },
	};

	// Get TypeScript SDK path
	let tsdk: string | undefined;

	// 1. Try user configuration first
	const userTsdk = vscode.workspace.getConfiguration("oxia").get<string>("typescript.tsdk");
	if (userTsdk) {
		tsdk = userTsdk;
	}

	// 2. Try workspace TypeScript
	if (!tsdk) {
		const workspaceTsdk = vscode.workspace.getConfiguration("typescript").get<string>("tsdk");
		if (workspaceTsdk) {
			tsdk = workspaceTsdk;
		}
	}

	// 3. Try VS Code"s built-in TypeScript
	if (!tsdk) {
		const tsExtension = vscode.extensions.getExtension("vscode.typescript-language-features");
		if (tsExtension) {
			const possiblePaths = [
				path.join(tsExtension.extensionPath, "node_modules", "typescript", "lib"),
				path.join(tsExtension.extensionPath, "..", "node_modules", "typescript", "lib"),
			];

			for (const testPath of possiblePaths) {
				if (fs.existsSync(path.join(testPath, "typescript.js"))) {
					tsdk = testPath;
					break;
				}
			}
		}
	}

	// 4. Try bundled TypeScript
	if (!tsdk) {
		try {
			const tsdkPath = require.resolve("typescript");
			tsdk = path.dirname(tsdkPath);
		} catch {
			// TypeScript not found
		}
	}

	if (!tsdk) {
		vscode.window.showWarningMessage(
			"Oxia: TypeScript SDK not found. Language features may not work correctly. Please set 'oxia.typescript.tsdk' in settings."
		);
	}

	const clientOptions: lsp.LanguageClientOptions = {
		documentSelector: [
			{ scheme: "file", language: "oxia" },
			{ scheme: "untitled", language: "oxia" },
		],
		initializationOptions: {
			typescript: {
				tsdk,
			},
		},
		middleware: {
			async provideCompletionItem(document, position, context, token, next) {
				const result = await next(document, position, context, token);
				if (!result) {
					return result;
				}

				// Fix/workaround for the incorrectly surrounding of auto-completed function calls.
				// Results in the same behavior as the default VS Code implementation:
				// Typing func( -> func()
				// Selecting func from the suggestion widget -> func(arg)

				const completeFunctionCalls =
					vscode.workspace.getConfiguration("typescript.suggest").get<boolean>("completeFunctionCalls") ||
					vscode.workspace.getConfiguration("javascript.suggest").get<boolean>("completeFunctionCalls");

				if (!completeFunctionCalls) {
					return result;
				}

				const items = Array.isArray(result) ? result : result.items;
				for (const item of items) {
					item.commitCharacters = [];
				}
				return items;
			},
		}
	};

	const client = new lsp.LanguageClient(
		"oxia",
		"Oxia Language Server",
		serverOptions,
		clientOptions
	);

	await client.start();

	// Auto-close tags and other features
	activateAutoInsertion([
		{ scheme: "file", language: "oxia" },
		{ scheme: "untitled", language: "oxia" },
	], client);

	// Register custom comment commands
	context.subscriptions.push(
		vscode.commands.registerCommand("oxia.commentLine", toggleLineComment),
		vscode.commands.registerCommand("oxia.blockComment", toggleBlockComment),
		vscode.commands.registerCommand("oxia.addCommentLine", addLineComment),
		vscode.commands.registerCommand("oxia.removeCommentLine", removeLineComment),
	);

	context.subscriptions.push(client);

	// support for https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volarjs-labs
	// ref: https://twitter.com/johnsoncodehk/status/1656126976774791168
	const labsInfo = createLabsInfo(serverProtocol);
	labsInfo.addLanguageClient(client);
	return labsInfo.extensionExports;
}

export function deactivate(): Thenable<void> | undefined {
	return undefined;
}

