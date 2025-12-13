import type { ResolvedMainOptions, ResolvedPathOptions, ResolvedServerOptions, ServerOptions } from "../../config/types.js";

export const DEFAULT_SERVER_PORT = 3000;

export function defaultServerOptions() {
	const out: ServerOptions = {
	};
	return out;
}

export function resolveServerOptions(serverOptions: ServerOptions, startOptions: ResolvedMainOptions, pathOptions: ResolvedPathOptions): ResolvedServerOptions {
	// In dev mode we do not copy static (public) to dist, so we server /dist and /static
	// In build mode we do copy static (public) to dist, so we server / dist only
	const out: ResolvedServerOptions = {
		port: serverOptions.port || DEFAULT_SERVER_PORT,
		host: serverOptions.host || "",
		open: !!serverOptions.open,
		route: serverOptions.route || "",
		routes: pathOptions.distRoutes,
		static: startOptions.cmd === "dev"
			? pathOptions.static
			: pathOptions.distStatic,
		code: serverOptions.code ?? false,
	};
	return out;
}