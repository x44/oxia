import * as prettier from "prettier";
import { toCode } from "../build/tsx2html/toCode.js";
import type { DevServerRequest } from "./server.js";

export async function formatMiddleware(req: DevServerRequest, path: string, content: string) {
	if (path.endsWith(".html")) {
		content = await prettier.format(content, {
			parser: "html",
			htmlWhitespaceSensitivity: "ignore",
			useTabs: false,
			tabWidth: 4,
			printWidth: 9999,
		});
		return content;
	}
	return undefined;
}

export function codeMiddleware(req: DevServerRequest, path: string, content: string) {
	if (path.endsWith(".html")) {
		return toCode(content);
	}
	return undefined;
}
