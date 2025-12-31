import type { ScopedStyleStrategy } from "../../config/types.js";
import { enc26 } from "../../util/uuid.js";
import type { FunctionInfo, ModuleInfo, SlotStyleInfo, StyleInfo } from "../oxia2tsx/types.js";
import { processGlobalCss, processScopedCss } from "../postcss/postcss.js";

// Must import to have global scope initialized
import "./style-results.js";
import { getStyleResult } from "./style-results.js";

type GlobalStyleRegistry = {
	css: string;
}

type UnresolvedScopedCss = {
	uuid: string;
	style: StyleInfo;
}

type ResolvedScopedCss = {
	uuid: string;
	styleId: string;
	module: ModuleInfo;
	function: FunctionInfo | undefined;
	css: string;
}

type ScopedStyleRegistry = {
	unresolvedMap: Map<string, UnresolvedScopedCss>;
	unresolvedList: UnresolvedScopedCss[];
	resolvedMap: Map<string, ResolvedScopedCss>;
	resolvedList: ResolvedScopedCss[];
}

type UnresolvedSlotCss = {
	uuid: string;
	childStyle: StyleInfo | undefined;
	slotStyle: SlotStyleInfo;
	slotChildName: string;
}

type ResolvedSlotCss = {
	uuid: string;
	styleId: string;
	function: FunctionInfo;
	slotName: string;
	slotChildName: string;
	css: string;
}

type SlotStyleRegistry = {
	unresolvedMap: Map<string, UnresolvedSlotCss>;
	unresolvedList: UnresolvedSlotCss[];
	resolvedMap: Map<string, ResolvedSlotCss>;
	resolvedList: ResolvedSlotCss[];
}

export type StyleRegistry = {
	globalStyleRegistry: GlobalStyleRegistry;
	scopedStyleRegistry: ScopedStyleRegistry;
	slotStyleRegistry: SlotStyleRegistry;

	scopedStyleStrategy: ScopedStyleStrategy;
	nextStyleId: number;
}

const DEBUG = false;

export function createStyleRegistry(scopedStyleStrategy: ScopedStyleStrategy): StyleRegistry {
	return {
		globalStyleRegistry: createGlobalStyleRegistry(),
		scopedStyleRegistry: createScopedStyleRegistry(),
		slotStyleRegistry: createSlotStyleRegistry(),
		scopedStyleStrategy,
		nextStyleId: 0,
	};
}

export function getStyleRegistryCss(styleRegistry: StyleRegistry) {
	let css = "";

	if (DEBUG) css += textBox("*** GLOBAL STYLES ***");

	css += getGlobalStyleRegistryCss(styleRegistry.globalStyleRegistry);

	if (DEBUG) css += textBox("*** SCOPED STYLES ***");

	css += getScopedStyleRegistryCss(styleRegistry.scopedStyleRegistry);

	if (DEBUG) css += textBox("*** SLOT STYLE OVERRIDES ***");

	css += getSlotStyleRegistryCss(styleRegistry.slotStyleRegistry);

	return css;
}

export function getStyleId(styleRegistry: StyleRegistry, uuid: string) {
	if (uuid.startsWith("SCOPED-")) {
		return getScopedStyleId(styleRegistry, uuid);
	} else
	if (uuid.startsWith("SLOT-")) {
		return getSlotStyleId(styleRegistry, uuid);
	}
	throw new Error(`invalid uuid ${uuid}`);
}

function getNextStyleId(styleRegistry: StyleRegistry) {
	return enc26(styleRegistry.nextStyleId++);
}


////////////////////////////////////////////////////////////////////////////////
// GLOBAL STYLE REGISTRY
////////////////////////////////////////////////////////////////////////////////

function createGlobalStyleRegistry(): GlobalStyleRegistry {
	return {
		css: "",
	}
}

function getGlobalStyleRegistryCss(registry: GlobalStyleRegistry) {
	return registry.css;
}

export function registerGlobalStyle(registry: StyleRegistry, styles: StyleInfo[]) {
	let css = combineCss(styles);
	css = processGlobalCss("dummy", css);
	registry.globalStyleRegistry.css = css;
}


////////////////////////////////////////////////////////////////////////////////
// SCOPED STYLE REGISTRY
////////////////////////////////////////////////////////////////////////////////

function createScopedStyleRegistry(): ScopedStyleRegistry {
	return {
		unresolvedMap: new Map<string, UnresolvedScopedCss>(),
		unresolvedList: [],
		resolvedMap: new Map<string, ResolvedScopedCss>(),
		resolvedList: [],
	}
}

function getScopedStyleRegistryCss(registry: ScopedStyleRegistry) {
	let css = "";
	for (let i = 0; i < registry.resolvedList.length; ++i) {
		if (DEBUG) {
			const func = registry.resolvedList[i].function;
			const str = func ? func.name : "Module";
			css += textBox("SCOPED STYLE", registry.resolvedList[i].module.srcFilePath, str);
		}

		css += registry.resolvedList[i].css;
	}
	return css;
}

export function registerScopedStyle(registry: StyleRegistry, style: StyleInfo) {
	const uuid = getScopedStyleUuid(style);

	let styleCss = registry.scopedStyleRegistry.unresolvedMap.get(uuid);
	if (!styleCss) {
		// debug("CREATING UNRESOLVED SCOPED STYLE", uuid);

		styleCss = {
			uuid,
			style,
		};

		registry.scopedStyleRegistry.unresolvedMap.set(uuid, styleCss);
		registry.scopedStyleRegistry.unresolvedList.push(styleCss);
	}

	return styleCss.uuid;
}

function getScopedStyleUuid(style: StyleInfo) {
	// Tag the uuid with "SCOPED", so we know where to look it up when the resolved style is requested
	const uuid = `SCOPED-${style.styleId}`;
	return uuid;
}

function getScopedStyleId(registry: StyleRegistry, uuid: string) {
	let resolvedScopedCss = registry.scopedStyleRegistry.resolvedMap.get(uuid);
	if (!resolvedScopedCss) {
		const unresolvedScopedCss = registry.scopedStyleRegistry.unresolvedMap.get(uuid)!;
		resolvedScopedCss = resolveScopedCss(registry, unresolvedScopedCss);
		registry.scopedStyleRegistry.resolvedMap.set(uuid, resolvedScopedCss);
		registry.scopedStyleRegistry.resolvedList.push(resolvedScopedCss);
	}

	return resolvedScopedCss.styleId;
}

function resolveScopedCss(registry: StyleRegistry, unresolved: UnresolvedScopedCss): ResolvedScopedCss {
	const style = unresolved.style;
	const styleId = getNextScopedStyleId(registry, style);
	let css = combineCss([style]);
	css = processScopedCss(registry.scopedStyleStrategy, "dummy", css, styleId);

	const resolved: ResolvedScopedCss = {
		uuid: unresolved.uuid,
		styleId,
		module: style.module,
		function: style.function,
		css,
	};

	return resolved;
}

function getNextScopedStyleId(registry: StyleRegistry, style: StyleInfo) {
	return style.fixedId || getNextStyleId(registry);
}


////////////////////////////////////////////////////////////////////////////////
// SLOT STYLE REGISTRY
////////////////////////////////////////////////////////////////////////////////

function createSlotStyleRegistry(): SlotStyleRegistry {
	return {
		unresolvedMap: new Map<string, UnresolvedSlotCss>(),
		unresolvedList: [],
		resolvedMap: new Map<string, ResolvedSlotCss>(),
		resolvedList: [],
	}
}

function getSlotStyleRegistryCss(registry: SlotStyleRegistry) {
	let css = "";
	for (let i = 0; i < registry.resolvedList.length; ++i) {
		if (DEBUG) {
			css += textBox("SLOT STYLE OVERRIDE", registry.resolvedList[i].function.module.srcFilePath, `${registry.resolvedList[i].function.name}() -> Slot(${registry.resolvedList[i].slotName}) -> ${registry.resolvedList[i].slotChildName}`);
		}

		css += registry.resolvedList[i].css;
	}
	return css;
}

export function registerSlotStyle(registry: StyleRegistry, slotParentStyle: StyleInfo | undefined, slotChildStyle: StyleInfo | undefined, slotStyle: SlotStyleInfo, slotChildName: string) {
	const uuid = getSlotStyleUuid(slotParentStyle, slotChildStyle, slotStyle);

	let styleCss = registry.slotStyleRegistry.unresolvedMap.get(uuid);
	if (!styleCss) {
		// debug("CREATING UNRESOLVED SLOTSTYLE", uuid);

		styleCss = {
			uuid,
			childStyle: slotChildStyle,
			slotStyle,
			slotChildName,
		};

		registry.slotStyleRegistry.unresolvedMap.set(uuid, styleCss);
		registry.slotStyleRegistry.unresolvedList.push(styleCss);
	}

	return styleCss.uuid;
}

function getSlotStyleUuid(slotParentStyle: StyleInfo | undefined, slotChildStyle: StyleInfo | undefined, slotStyle: SlotStyleInfo) {
	const slotParentStyleId = slotParentStyle ? slotParentStyle.styleId : "none";
	const slotChildStyleId = slotChildStyle ? slotChildStyle.styleId: "none";
	// Tag the uuid with "SLOT", so we know where to look it up when the resolved style is requested
	const uuid = `SLOT-${[slotParentStyleId, slotChildStyleId, slotStyle.styleId].join("+")}`;
	return uuid;
}

function getSlotStyleId(registry: StyleRegistry, uuid: string) {
	let resolvedSlotCss = registry.slotStyleRegistry.resolvedMap.get(uuid);
	if (!resolvedSlotCss) {
		const unresolvedSlotCss = registry.slotStyleRegistry.unresolvedMap.get(uuid)!;
		resolvedSlotCss = resolveSlotCss(registry, unresolvedSlotCss);
		registry.slotStyleRegistry.resolvedMap.set(uuid, resolvedSlotCss);
		registry.slotStyleRegistry.resolvedList.push(resolvedSlotCss);
	}
	return resolvedSlotCss.styleId;
}

function resolveSlotCss(registry: StyleRegistry, unresolved: UnresolvedSlotCss): ResolvedSlotCss {
	const childStyle = unresolved.childStyle;
	const slotStyle = unresolved.slotStyle;

	const styleId = getNextSlotStyleId(registry, childStyle, slotStyle);
	let css = combineCss(childStyle ? [childStyle] : [], slotStyle);
	css = processScopedCss(registry.scopedStyleStrategy, "dummy", css, styleId);

	const resolved: ResolvedSlotCss = {
		uuid: unresolved.uuid,
		styleId,
		function: slotStyle.function,
		slotName: slotStyle.slotName,
		slotChildName: unresolved.slotChildName,
		css,
	};
	return resolved;
}

function getNextSlotStyleId(registry: StyleRegistry, slotChildStyle: StyleInfo | undefined, slotStyle: SlotStyleInfo) {
	let id: string | undefined = undefined;
	const fixedIds: string[] = [];
	let useFixedIds = false;

	if (slotChildStyle && slotChildStyle.fixedId) {
		useFixedIds = true;
		fixedIds.push(slotChildStyle.fixedId);
	} else {
		if (!id) id = getNextStyleId(registry);
		fixedIds.push(id);
	}

	if (slotStyle.fixedId) {
		useFixedIds = true;
		fixedIds.push(slotStyle.fixedId);
	} else {
		if (!id) id = getNextStyleId(registry);
		fixedIds.push(id);
	}

	if (useFixedIds) {
		return fixedIds.join("-");
	}
	return id || getNextStyleId(registry);
}

function combineCss(styles: StyleInfo[], slotStyle?: SlotStyleInfo) {
	let css = "";
	for (const style of styles)	{
		const styleCss = replaceTsBlocksWithResults(style);
		css = appendNonEmptyLines(styleCss, css);
	}
	if (slotStyle) {
		const styleCss = replaceTsBlocksWithResults(slotStyle);
		css = appendNonEmptyLines(styleCss, css);
	}
	return css;
}

function replaceTsBlocksWithResults(style: StyleInfo | SlotStyleInfo) {
	const css = style.css;

	const tsBlocks = style.tsBlocks;
	if (!tsBlocks.length) {
		return css;
	}

	let out = "";
	let pos = 0;
	for (const tsBlock of tsBlocks) {
		out += css.substring(pos, tsBlock.curlyOpenPos);
		out += getStyleResult(tsBlock.id);
		pos = tsBlock.curlyClosePos + 1;
	}

	out += css.substring(pos);

	return out;
}

function appendNonEmptyLines(src: string, dst: string) {
	const lines = src.split("\n");
	for (let i = 0; i < lines.length; ++i) {
		const line = lines[i];
		if (line.trim().length > 0) dst += line + "\n";
	}
	return dst;
}

function textBox(title: string, ...contents: string[]) {
	const w = 72;
	let s = "";
	const dashes = "-".repeat(w + 4);
	s += `/* ${dashes} */\n`;
	const padL = Math.trunc((w - title.length) / 2);
	const padR = w - padL - title.length;
	s += `/* - ${" ".repeat(padL)}${title}${" ".repeat(padR)} - */\n`;

	for (const content of contents) {
		s += `/* - ${content}${" ".repeat(Math.max(0, w - content.length))} - */\n`;
	}

	s += `/* ${dashes} */\n`;
	return s;
}
