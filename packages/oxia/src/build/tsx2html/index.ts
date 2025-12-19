import * as prettier from "prettier";
import type { ResolvedOptions } from "../../config/types.js";
import { writeTextFile } from "../../util/fs.js";
import { Log } from "../../util/log.js";
import { Timings } from "../../util/timings.js";
import type { RouteFile } from "../file/file.js";
import toHtml from "./toHtml.js";

export async function tsx2html(options: ResolvedOptions, file: RouteFile) {
	Log.debug(`tsx2html ${file.oxiaAbsPath}`);

	Timings.begin("tsx2html");

	let html = await toHtml(options, file);

	const buildOptions = options.build;
	if (buildOptions.format) {

		Timings.begin("formatHtml");

		html = await prettier.format(html, {
			parser: "html",
			htmlWhitespaceSensitivity: "ignore",
			useTabs: buildOptions.useTabs,
			tabWidth: buildOptions.tabWidth,
			printWidth: 9999,
		});

		Timings.end();
	}

	Timings.end();

	return html;
}

export function writeErrorHtml(file: RouteFile, error: string) {
	error = error.replaceAll("\n", "<br>");
	const html =`<!DOCTYPE html><html><head></head><body style="background: #800000; color: #f0f0f0; font-family: monospace; font-size: 14px; line-height: 1.5; white-space: preserve;"><div>${file.oxiaAbsPath}<div><br><div>${error}<div></body></html>`;
	writeTextFile(file.htmlAbsPath, html);
}
