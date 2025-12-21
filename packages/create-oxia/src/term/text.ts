import chalk, { ChalkInstance } from "chalk";
import { getTheme } from "./theme.js";

type TextStyle = "title" | "border" | "normal" | "primary" | "secondary" | "success" | "error" | "input" | "placeholder";

export type StyledText = { text: string; style: TextStyle; highlight?: boolean }[];

function applyTextStyle(text: string, style: TextStyle, active: boolean, highlight: boolean) {
	const colors = getTheme().colors;

	let bg = active ? colors.bgActive : colors.bgInActive;
	let fg: string | undefined = undefined;

    switch (style) {
        case "title": {
			bg = active ? colors.titleBgActive : colors.titleBgInActive;
			fg = active ? colors.titleFgActive : colors.titleFgInActive;
		} break;
        case "border": {
			fg = active ? colors.borderFgActive : colors.borderFgInActive;
		} break;
        case "normal": {
			fg = active ? colors.normalFgActive : colors.normalFgInActive;
			if (highlight) {
				const hibg = active ? colors.highlightBgActive : colors.highlightBgInActive;
				if (hibg) bg = hibg;
				fg = active ? colors.highlightFgActive : colors.highlightFgInActive;
				// fg = active ? colors.highlightNormalFgActive : colors.highlightNormalFgInActive;
			}
		} break;
        case "primary": {
			fg = active ? colors.primaryFgActive : colors.primaryFgInActive;
			if (highlight) {
				const hibg = active ? colors.highlightBgActive : colors.highlightBgInActive;
				if (hibg) bg = hibg;
				fg = active ? colors.highlightFgActive : colors.highlightFgInActive;
				// fg = active ? colors.highlightPrimaryFgActive : colors.highlightPrimaryFgInActive;
			}
		} break;
        case "secondary": {
			fg = active ? colors.secondaryFgActive : colors.secondaryFgInActive;
			if (highlight) {
				const hibg = active ? colors.highlightBgActive : colors.highlightBgInActive;
				if (hibg) bg = hibg;
				fg = active ? colors.highlightFgActive : colors.highlightFgInActive;
				// fg = active ? colors.highlightSecondaryFgActive : colors.highlightSecondaryFgInActive;
			}
		} break;
        case "success": {
			fg = active ? colors.successFgActive : colors.successFgInActive;
		} break;
        case "error": {
			fg = active ? colors.errorFgActive : colors.errorFgInActive;
		} break;
        case "input": {
			bg = active ? colors.inputBgActive : colors.inputBgInActive;
			fg = active ? colors.inputFgActive : colors.inputFgInActive;
		} break;
        case "placeholder": {
			bg = active ? colors.inputBgActive : colors.inputBgInActive;
			fg = active ? colors.placeholderFgActive : colors.placeholderFgInActive;
		} break;
    }

	return applyBgAndFg(bg, fg)(text);
}

// function applyBgAndFg(bg: string | undefined, fg: string | undefined): ChalkInstance {
// 	if (!bg && !fg) return chalk;
// 	return bg && fg
// 		? chalk.bgHex(bg).hex(fg)
// 		: bg
// 			? chalk.bgHex(bg)
// 			: chalk.hex(fg);
// }

function applyBgAndFg(bg: string | undefined, fg: string | undefined): ChalkInstance {
	if (!bg && !fg) return chalk;
	return bg && fg
		? toBgFg(bg, fg)
		: bg
			? toBg(bg)
			: toFg(fg);
}

function toBgFg(bgHexOrKey: string, fgHexOrKey: string) {
	const bg = toBg(bgHexOrKey);
	if (fgHexOrKey.startsWith("#")) return bg.hex(fgHexOrKey);
	switch (fgHexOrKey) {
		case "dimmed": return bg.dim;
		case "normal": return bg;
		case "bright": return bg.bold;
		case "red": return bg.red;
		case "green": return bg.green;
	}
	return bg.white;
}

function toBg(hexOrKey: string) {
	if (hexOrKey.startsWith("#")) return chalk.bgHex(hexOrKey);
	switch (hexOrKey) {
		case "dimmed": return chalk.bgBlack;
		case "normal": return chalk.bgBlack;
		case "bright": return chalk.bgBlackBright;
		case "red": return chalk.redBright;
		case "green": return chalk.greenBright;
	}
	return chalk.bgBlack;
}

function toFg(hexOrKey: string) {
	if (hexOrKey.startsWith("#")) return chalk.hex(hexOrKey);
	switch (hexOrKey) {
		case "dimmed": return chalk.dim;
		case "normal": return chalk;
		case "bright": return chalk.bold;
		case "red": return chalk.redBright;
		case "green": return chalk.greenBright;
	}
	return chalk.white;
}

export function toStyledString(styledText: StyledText, active: boolean): string {
    return styledText.map(st => applyTextStyle(st.text, st.style, active, st.highlight)).join("");
}

export function getStyledTextLength(styledText: StyledText) {
	// Note that we unstyle, since it is possible that StyledText.text is a chalked string
    return styledText.reduce((len, s) => len + unstyled(s.text).length, 0);
}

export function createStyledText(text: string, style: TextStyle, highlight?: boolean) {
    return [{ text, style, highlight }];
}

export function appendStyledText(styledText: StyledText, text: string, style: TextStyle, highlight?: boolean) {
    const array = Array.isArray(styledText) ? styledText : [styledText];
    array.push(...createStyledText(text, style, highlight));
    return array;
}

export function highlightStyledText(styledText: StyledText, highlight: boolean) {
	if (!highlight) {
		return styledText;
	}
	return styledText.map(st => {
		return { text: st.text, style: st.style, highlight: highlight }
	});
}

function unstyled(s: string) {
	return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}
