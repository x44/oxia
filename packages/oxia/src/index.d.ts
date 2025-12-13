import type { Config } from "./config/types.js";
import { type React } from "./react/react.js";
import { type BuildProps, type GlobalProps } from "./react/types.js";

export function defineConfig(config: Config): Config;

declare global {
	const React: React;
	const JSX: typeof import("./react/jsx.js");
	const GlobalProps: GlobalProps;
	const BuildProps: BuildProps;
	const Script: typeof import("./react/components/Script.js").Script;
	const Style: typeof import("./react/components/Style.js").Style;
}
