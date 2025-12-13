import type { ScopedStyleStrategy } from "../../config/types.js";
import { enc26 } from "../../util/uuid.js";
import { processCss } from "../postcss/postcss.js";
import type { FunctionInfo, ModuleInfo, SlotStyleInfo, StyleInfo } from "../oxia2tsx/types.js";

// Must import to have global scope initialized
import "./style-results.js";
import { getStyleResult } from "./style-results.js";

type UnresolvedComponentCss = {
	uuid: string;
	styles: StyleInfo[];
}

type ResolvedComponentCss = {
	uuid: string;
	styleId: string;
	module: ModuleInfo;
	functions: (FunctionInfo | undefined)[];
	css: string;
}

type ComponentStyleRegistry = {
	unresolvedMap: Map<string, UnresolvedComponentCss>;
	unresolvedList: UnresolvedComponentCss[];
	resolvedMap: Map<string, ResolvedComponentCss>;
	resolvedList: ResolvedComponentCss[];
}

type UnresolvedSlotCss = {
	uuid: string;
	childStyles: StyleInfo[];
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
	componentStyleRegistry: ComponentStyleRegistry;
	slotStyleRegistry: SlotStyleRegistry;

	scopedStyleStrategy: ScopedStyleStrategy;
	nextStyleId: number;
}

const DEBUG = false;

export function createStyleRegistry(scopedStyleStrategy: ScopedStyleStrategy): StyleRegistry {
	return {
		componentStyleRegistry: createComponentStyleRegistry(),
		slotStyleRegistry: createSlotStyleRegistry(),
		scopedStyleStrategy,
		nextStyleId: 0,
	};
}

export function getStyleRegistryCss(styleRegistry: StyleRegistry) {
	let css = "";

	if (DEBUG) css += textBox("*** COMPONENT STYLES ***");

	css += getComponentStyleRegistryCss(styleRegistry.componentStyleRegistry);

	if (DEBUG) css += textBox("*** SLOT STYLE OVERRIDES ***");

	css += getSlotStyleRegistryCss(styleRegistry.slotStyleRegistry);

	return css;
}

export function getStyleId(styleRegistry: StyleRegistry, uuid: string) {
	if (uuid.startsWith("COMPONENT-")) {
		return getComponentStyleId(styleRegistry, uuid);
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
// COMPONENT STYLE REGISTRY
////////////////////////////////////////////////////////////////////////////////

function createComponentStyleRegistry(): ComponentStyleRegistry {
	return {
		unresolvedMap: new Map<string, UnresolvedComponentCss>(),
		unresolvedList: [],
		resolvedMap: new Map<string, ResolvedComponentCss>(),
		resolvedList: [],
	}
}

function getComponentStyleRegistryCss(registry: ComponentStyleRegistry) {
	let css = "";
	for (let i = 0; i < registry.resolvedList.length; ++i) {
		if (DEBUG) {
			const strs = registry.resolvedList[i].functions.map(func => !func ? "Module" : `${func.name}()`);
			css += textBox("COMPONENT STYLE", registry.resolvedList[i].module.srcFilePath, strs.join(" + "));
		}

		css += registry.resolvedList[i].css;
	}
	return css;
}

export function registerComponentStyle(registry: StyleRegistry, styles: StyleInfo[]) {
	const uuid = getComponentStyleUuid(styles);

	let styleCss = registry.componentStyleRegistry.unresolvedMap.get(uuid);
	if (!styleCss) {
		// debug("CREATING UNRESOLVED COMPONENT STYLE", uuid);

		styleCss = {
			uuid,
			styles: [...styles],
		}

		registry.componentStyleRegistry.unresolvedMap.set(uuid, styleCss);
		registry.componentStyleRegistry.unresolvedList.push(styleCss);
	}

	return styleCss.uuid;
}

function getComponentStyleUuid(styles: StyleInfo[]) {
	const styleIds = styles.map(style => style.styleId);
	// Tag the uuid with "COMPONENT", so we know where to look it up then the resolved style is requested
	const uuid = `COMPONENT-${[styleIds].join("+")}`;
	return uuid;
}

function getComponentStyleId(registry: StyleRegistry, uuid: string) {
	let resolvedComponentCss = registry.componentStyleRegistry.resolvedMap.get(uuid);
	if (!resolvedComponentCss) {
		const unresolvedComponentCss = registry.componentStyleRegistry.unresolvedMap.get(uuid)!;
		resolvedComponentCss = resolveComponentCss(registry, unresolvedComponentCss);
		registry.componentStyleRegistry.resolvedMap.set(uuid, resolvedComponentCss);
		registry.componentStyleRegistry.resolvedList.push(resolvedComponentCss);
	}

	return resolvedComponentCss.styleId;
}

function resolveComponentCss(registry: StyleRegistry, unresolved: UnresolvedComponentCss): ResolvedComponentCss {
	const styles = unresolved.styles;
	const styleId = getNextComponentStyleId(registry, styles);
	let css = combineCss(styles);
	css = processCss(registry.scopedStyleStrategy, "dummy", css, styleId);

	const resolved: ResolvedComponentCss = {
		uuid: unresolved.uuid,
		styleId,
		module: styles[0].module,
		functions: styles.map(style => style.function),
		css,
	}

	return resolved;
}

function getNextComponentStyleId(registry: StyleRegistry, styles: StyleInfo[]) {
	let id: string | undefined = undefined;
	const fixedIds: string[] = [];
	let useFixedIds = false;
	for (let i = 0; i < styles.length; ++i) {
		const fixedId = styles[i].fixedId;
		if (fixedId) {
			useFixedIds = true;
			fixedIds.push(fixedId);
		} else {
			if (!id) id = getNextStyleId(registry);
			fixedIds.push(id);
		}
	}

	if (useFixedIds) {
		return fixedIds.join("-");
	}
	return id || getNextStyleId(registry);
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

export function registerSlotStyle(registry: StyleRegistry, slotParentStyles: StyleInfo[] | undefined, slotChildStyles: StyleInfo[] | undefined, slotStyle: SlotStyleInfo, slotChildName: string) {
	const parentStyles = slotParentStyles || [];
	const childStyles = slotChildStyles || [];

	if (parentStyles.length && childStyles.length) {
		// Remove from parentStyles those elements that are also in childStyles.
		// Since we create a combined style, we can avoid some extra work in
		// the postcss steps by doing so.
		for (let i = parentStyles.length - 1; i >= 0; --i) {
			if (childStyles.includes(parentStyles[i])) parentStyles.splice(i, 1);
		}
	}

	const uuid = getSlotStyleUuid(parentStyles, childStyles, slotStyle);

	let styleCss = registry.slotStyleRegistry.unresolvedMap.get(uuid);
	if (!styleCss) {
		// debug("CREATING UNRESOLVED SLOTSTYLE", uuid);

		styleCss = {
			uuid,
			childStyles: [...childStyles],
			slotStyle,
			slotChildName,
		}

		registry.slotStyleRegistry.unresolvedMap.set(uuid, styleCss);
		registry.slotStyleRegistry.unresolvedList.push(styleCss);
	}

	return styleCss.uuid;
}

function getSlotStyleUuid(slotParentStyles: StyleInfo[], slotChildStyles: StyleInfo[], slotStyle: SlotStyleInfo) {
	const slotParentStyleIds = slotParentStyles.map(style => style.styleId);
	const slotChildStyleIds = slotChildStyles.map(style => style.styleId);
	// Tag the uuid with "SLOT", so we know where to look it up then the resolved style is requested
	const uuid = `SLOT-${[slotParentStyleIds, slotChildStyleIds, slotStyle.styleId].join("+")}`;
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
	const childStyles = unresolved.childStyles;
	const slotStyle = unresolved.slotStyle;

	const styleId = getNextSlotStyleId(registry, childStyles, slotStyle);
	let css = combineCss(childStyles, slotStyle);
	css = processCss(registry.scopedStyleStrategy, "dummy", css, styleId);

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

function getNextSlotStyleId(registry: StyleRegistry, slotChildStyles: StyleInfo[], slotStyle: SlotStyleInfo) {
	let id: string | undefined = undefined;
	const fixedIds: string[] = [];
	let useFixedIds = false;
	for (let i = 0; i < slotChildStyles.length; ++i) {
		const fixedId = slotChildStyles[i].fixedId;
		if (fixedId) {
			useFixedIds = true;
			fixedIds.push(fixedId);
		} else {
			if (!id) id = getNextStyleId(registry);
			fixedIds.push(id);
		}
	}
	const fixedId = slotStyle.fixedId;
	if (fixedId) {
		useFixedIds = true;
		fixedIds.push(fixedId);
	} else {
		if (!id) id = getNextStyleId(registry);
		fixedIds.push(id);
	}

	if (useFixedIds) {
		return fixedIds.join("-");
	}
	return id || getNextStyleId(registry);
}

function combineCss(childStyles: StyleInfo[], slotStyle?: SlotStyleInfo) {
	let css = "";
	for (const childStyle of childStyles)	{
		const styleCss = replaceTsBlocksWithResults(childStyle);
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