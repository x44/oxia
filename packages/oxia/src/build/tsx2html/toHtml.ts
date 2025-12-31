import { basename, dirname } from "node:path";
import type { ResolvedOptions } from "../../config/types.js";
import type Element from "../../react/elements/Element.js";
import { React } from "../../react/react.js";
import type { BuildProps } from "../../react/types.js";
import { Log } from "../../util/log.js";
import type { RouteFile } from "../file/file.js";
import { createStyleRegistry, getStyleRegistryCss, registerGlobalStyle } from "./style-registry.js";
//@ts-ignore
import Script from "../../react/components/Script.oxia";
//@ts-ignore
import Style from "../../react/components/Style.oxia";
import { Timings } from "../../util/timings.js";
import { DependencyRegistry } from "../dependencies/dependency-registry.js";
import { getGlobalStylesForModules } from "../oxia2tsx/module-registry.js";

export default async function toHtml(options: ResolvedOptions, file: RouteFile) {
	// Log.debug("converting", srcFilePath);

	// Store build information in React
	// Used, for example, by Script.oxia to resolve it's input and output file paths.
	React.srcStaticDir = options.paths.static;
	React.srcSourceDir = options.paths.source;
	React.srcRoutesDir = options.paths.routes;
	React.dstStaticDir = options.paths.distStatic;
	React.dstRoutesDir = options.paths.distRoutes;

	React.srcFilePath = file.oxiaAbsPath;
	React.srcFileDir  = dirname(file.oxiaAbsPath);
	React.srcFileName = basename(file.oxiaAbsPath);

	React.dstFilePath = file.htmlAbsPath;
	React.dstFileDir  = dirname(file.htmlAbsPath);
	React.dstFileName = basename(file.htmlAbsPath);

	// Store build information in BuildProps
	const buildProps: BuildProps = {
		oxiaFilePath: file.oxiaAbsPath,                // "/project/src/routes/index.oxia", "/project/src/routes/about.oxia"
		oxiaFileDir:  dirname(file.oxiaAbsPath),       // "/project/src/routes", "/project/src/routes"
		oxiaFileName: basename(file.oxiaAbsPath),      // "index.oxia", "about.oxia"
		route:       file.route,                       // "", "about"
		routePath:   file.routePath,                   // "/", "/about"
		routeName:   file.routeName,                   // "index", "about"
	};
	(globalThis as any).BuildProps = buildProps;

	// Set React in the global scope.
	// This avoids the need for appending import statements to each .oxia file.
	(globalThis as any).React = React;
	(globalThis as any).Script = Script;
	(globalThis as any).Style = Style;

	const fileUrl = file.oxiaAbsPath;

	// Load the .oxia file and invoke the default export function
	Log.debug("loading", fileUrl);

	Timings.begin("import");

	const module = await import(fileUrl);

	Timings.end();

	const defaultFunction: ((props: any) => Element) | undefined = module.default;

	if (!defaultFunction && typeof defaultFunction !== "function") {
		Log.warn("");
		Log.warn("------------------------------------------------------");
		Log.warn("No content!");
		Log.warn("Did you forget to 'export default' your main function?");
		Log.warn("------------------------------------------------------\n");
		return "";
	}

	Timings.begin("react");

	React.reset();
	React.createElement(defaultFunction, {})!;

	Timings.end();

	Timings.begin("convert");

	/** The root element of the tree. This always is a <fragment> */
	let root = React.getRoot();
	/** The <html> element of the tree. Undefined if no <html> exists. This never is a <fragment> */
	const html = React.getHtml();
	/** The <head> element of the tree. Undefined if no <head> exists. This never is a <fragment> */
	const head = React.getHead();
	/** The <body> element of the tree. Undefined if no <body> exists. This never is a <fragment> */
	const body = React.getBody();

	let htmlCode = "";

	if (root) {
		const styleRegistry = createStyleRegistry(options.build.scopedStyleStrategy);

		const globalStyleModules = DependencyRegistry.getAllRouteDependencyPathsForGlobalStyles(file.oxiaAbsPath);
		const globalStyles = getGlobalStylesForModules(globalStyleModules);
		registerGlobalStyle(styleRegistry, globalStyles);

		// root.addDebugInfo();

		root.initComponentReferences();

		root.registerScopedStyle(styleRegistry);

		root = root.slotify(styleRegistry);

		root = root.render()!;
		root = root.flatify(!options.build.keepFragments, !options.build.keepSlots);

		root.resolveScopedStyles(styleRegistry);

		const css = getStyleRegistryCss(styleRegistry);
		root.setRouteCss(html, head, body, css);

		root.finalize(html, head, body);

		// Log.log("--------------------------------------------------------------------");
		// root.debug();
		// Log.log("--------------------------------------------------------------------");

		// Log.log("--------------------------------------------------------------------");
		// root.dump();
		// Log.log("--------------------------------------------------------------------");

		// rootElement.dump();
		htmlCode = root.toHtml(styleRegistry, "", !!options.build.keepFragments);
	} else {
		Log.warn(`module '${file.oxiaAbsPath}' returned no JSX`);
	}

	htmlCode = validate(htmlCode);

	Timings.end();

	return htmlCode;
}

function validate(html: string) {
	html = `<!DOCTYPE html>\n${html}`;
	return html;
}
