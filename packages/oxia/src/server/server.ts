import chalk from "chalk";
import express, { type Express, type Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { Server } from "http";
import { readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { argv } from "node:process";
import open from "open";
import type QueryString from "qs";
import { WebSocketServer } from "ws";
import type { ResolvedOptions, ResolvedServerOptions } from "../config/types.js";
import { absPath } from "../util/fs.js";
import { Log } from "../util/log.js";
import { codeMiddleware, formatMiddleware } from "./middleware.js";

export type DevServerRequest = Request<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>;
type DevServerMiddleWare = (req: DevServerRequest, path: string, content: string) => Promise<string | undefined> | (string | undefined);
type DevServer = {
	server: Server;
	wss: WebSocketServer;
}

const contentTypeMap = new Map<string, string>([
	[".aac", "audio/aac"],
	[".abw", "application/x-abiword"],
	[".apng", "image/apng"],
	[".arc", "application/x-freearc"],
	[".avif", "image/avif"],
	[".avi", "video/x-msvideo"],
	[".azw", "application/vnd.amazon.ebook"],
	[".bin", "application/octet-stream"],
	[".bmp", "image/bmp"],
	[".bz", "application/x-bzip"],
	[".bz2", "application/x-bzip2"],
	[".cda", "application/x-cdf"],
	[".csh", "application/x-csh"],
	[".css", "text/css"],
	[".csv", "text/csv"],
	[".doc", "application/msword"],
	[".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
	[".eot", "application/vnd.ms-fontobject"],
	[".epub", "application/epub+zip"],
	[".gz", "application/gzip"],
	[".gif", "image/gif"],
	[".htm", "text/html"],
	[".html", "text/html"],
	[".ico", "image/vnd.microsoft.icon"],
	[".ics", "text/calendar"],
	[".jar", "application/java-archive"],
	[".jpg", "image/jpeg"],
	[".jpeg", "image/jpeg"],
	[".js", "text/javascript"],
	[".json", "application/json"],
	[".jsonld", "application/ld+json"],
	[".md", "text/markdown"],
	[".mid", "audio/midi"],
	[".mjs", "text/javascript"],
	[".mp3", "audio/mpeg"],
	[".mp4", "video/mp4"],
	[".mpeg", "video/mpeg"],
	[".mpkg", "application/vnd.apple.installer+xml"],
	[".odp", "application/vnd.oasis.opendocument.presentation"],
	[".ods", "application/vnd.oasis.opendocument.spreadsheet"],
	[".odt", "application/vnd.oasis.opendocument.text"],
	[".oga", "audio/ogg"],
	[".ogv", "video/ogg"],
	[".ogx", "application/ogg"],
	[".opus", "audio/ogg"],
	[".otf", "font/otf"],
	[".png", "image/png"],
	[".pdf", "application/pdf"],
	[".php", "application/x-httpd-php"],
	[".ppt", "application/vnd.ms-powerpoint"],
	[".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
	[".rar", "application/vnd.rar"],
	[".rtf", "application/rtf"],
	[".sh", "application/x-sh"],
	[".svg", "image/svg+xml"],
	[".tar", "application/x-tar"],
	[".tif", "image/tiff"],
	[".ts", "video/mp2t"],
	[".ttf", "font/ttf"],
	[".txt", "text/plain"],
	[".vsd", "application/vnd.visio"],
	[".wav", "audio/wav"],
	[".weba", "audio/webm"],
	[".webm", "video/webm"],
	[".webmanifest", "application/manifest+json"],
	[".webp", "image/webp"],
	[".woff", "font/woff"],
	[".woff2", "font/woff2"],
	[".xhtml", "application/xhtml+xml"],
	[".xls", "application/vnd.ms-excel"],
	[".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
	[".xml", "application/xml"],
	[".xul", "application/vnd.mozilla.xul+xml"],
	[".zip", "application/zip"],
	[".3gp", "video/3gpp"],
	[".3g2", "video/3gpp2"],
	[".7z", "application/x-7z-compressed"],
]);

let oxiaDir = dirname(argv[1]);
oxiaDir = oxiaDir.includes("node_modules") ? `${oxiaDir}/dist` : `${oxiaDir}`;
let clientReloadScriptPath = absPath(oxiaDir, "server", "client-reload.js");
let clientReloadScriptCode: string | undefined = undefined;

const devServers: DevServer[] = [];

export function setDevServerClientReloadScriptDir(dir: string) {
	clientReloadScriptPath = absPath(dir, "client-reload.js");
}

function loadClientReloadScript() {
	if (clientReloadScriptCode !== undefined) return;
	clientReloadScriptCode = `\t\t<script>\n${("\n" + readFileSync(clientReloadScriptPath, "utf8")).replaceAll("\n\n", "\n").split("\n").join("\n\t\t\t").substring(1)}\n\t\t</script>`;
}

export async function startDevServer(options: ResolvedOptions, ...middlewares: DevServerMiddleWare[]) {
	Log.log();
	await startDevServerInstance(options.server, "HTML", 0, [...middlewares]);
	if (options.server.code) {
		// In case the HTML is not formatted yet, format it now
		const format = !options.build.format;
		await startDevServerInstance(options.server, "CODE", 1000, [...middlewares, ...(format ? [formatMiddleware] : []), codeMiddleware]);
	}
	Log.log();
}

async function startDevServerInstance(options: ResolvedServerOptions, name: string, portIncrement: number, middlewares: DevServerMiddleWare[]) {

	loadClientReloadScript();

	const routesDir = options.routes;
	const staticDir = options.static;

	const app = express();

	app.use(async (req, res, next) => {

		// If it's a directory request without trailing slash, redirect
		if (!req.path.includes('.') && !req.path.endsWith('/')) {
			return res.redirect(301, req.path + '/')
		}

		// Map routes to their index.html
		let [path, query] = req.url.split("?");
		if (!path.includes(".")) {
			if (!path.endsWith("/")) path += "/";
			path += "index.html";
			req.url = !!query
				? [path, query].join("?")
				: path;
		}

		try {
			let content = readFileSync(join(routesDir, path), "utf8");

			for (let i = 0; i < middlewares.length; ++i) {
				content = await runMiddleware(middlewares[i], req, path, content);
			}

			const ext = extname(path);
			if (ext === ".html") {
				// Inject reload client script
				content += clientReloadScriptCode;
			}

			const contentType = contentTypeMap.get(ext);
			if (contentType) {
				res.setHeader("Content-Type", contentType);
			} else {
				Log.warn("no content type for", path);
			}

			res.setHeader("Cache-Control", "no-store");
			res.end(content);
			return;
		} catch (err) {
			// Let express handle it with 404
		}

		next();
	});

	// static *after* - in case staticDir and routesDir are equal,
	// we want to prioritize routes over static to get our middlewares called.
	app.use(express.static(staticDir, {
		setHeaders: (res, path, stat) => {
			res.set("Cache-Control", "no-store");
		},
	}));


	let port = (options.port || 3000) + portIncrement;
	const host = options.host || "127.0.0.1";

	Log.debug(`starting on http://${host}:${port}`);

	const server = await start(app, host, port, name);

	const wss = new WebSocketServer({
		server
	});

	devServers.push({
		server,
		wss,
	});

	Log.debug("serving routes from", routesDir);
	Log.debug("serving static from", staticDir);

	if (options.open) {
		let route = options.route;
		if (route && !route.startsWith("/")) route = "/" + route;
		const url = `http://${host}:${port}${route}`;
		Log.debug(`opening ${url}`);
		open(url);
	}
}

async function runMiddleware(middleware: DevServerMiddleWare, req: DevServerRequest, path: string, content: string) {
	const result = await middleware(req, path, content);
	return (result !== undefined) ? result : content;
}

async function start(app: Express, host: string, port: number, name: string) {
	return new Promise<Server>(resolve => {
		const server = app.listen(port, host);
		server.on("error", (err) => {
			if (err.name !== "AddrInUse" && !err.message.includes("EADDRINUSE")) {
				Log.error("Server:", err);
				process.exit(1);
			} else {
				Log.debug(`port ${port} is in use, trying ${port + 1}`);
				++port;
				resolve(start(app, host, port, name));
			}
		});

		server.on("listening", () => {
			Log.writeln(`${chalk.blue(name)}  ➜  ${chalk.cyanBright(`http://${host}:${port}`)}`);

			resolve(server);
		});
	});
}

export function reloadDevServer() {
	for (const devServer of devServers) {
		if (devServer.wss) {
			devServer.wss.clients.forEach(client => {
				if (client.readyState === 1) {
					client.send("reload");
				}
			});
		}
	}
}
