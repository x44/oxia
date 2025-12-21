import { DocumentMetas } from "./document-meta.js";
import { blankCommentsAndStrings, findCharBwd, findCharFwd } from "./string.js";

type SectionType =
| "style"
| "ts"

type StyleSectionSubType =
| "css"
| "ts"

type Section = {
	type: SectionType;
	pos: number;
	end: number;
}

type StyleSection = Section & {
	type: "style";
	subType: StyleSectionSubType;
	innerPos: number; // Position of first char after the '>' of <style>
	innerEnd: number; // Position of '<' of </style>
}

/**
 * <style>...</style>
 */
type CssStyleSection = StyleSection & {
	subType: "css";
	tsCurlySections: TsCurlySection[]; // The {`...`} part of each, for example, color: {`...`};
}

/**
 * <style>{`...`}</style>
 */
type TsStyleSection = StyleSection & TsCurlySection & {
	subType: "ts";
}

/**
 * {`...`}
 */
type TsCurlySection = Section & {
	curlyOpenPos: number;      // the opening { of {``}
	curlyClosePos: number;     // the closing } of {``}
	backtickOpenPos: number;   // the opening ` of {``}
	backtickClosePos: number;  // the closing ` of {``}
	isQuoted: boolean;         // div { content: "{`...`}"; } or div { content: '{`...`}'; }
}

type TsSection = {
	pos: number;
	end: number;
}

/**
 * Parses source code for further processing.
 * @param fileId The document file ID
 * @param content The document content
 * @returns
 * - a string with the pure CSS content
 * - a string with the pure TSX content
 * - a position-sorted array of style sections
 * - a position-sorted array of ts sections
 */
export function parseDocument(fileId: string, content: string): {
		cssContent: string,
		tsxContent: string,
		styleSections: StyleSection[],
		tsSections: TsSection[]
} {
	const contentNoCommentsEmptyStrings = blankCommentsAndStrings(content);

	const styleSections = parseStyleSections(contentNoCommentsEmptyStrings, content);

	const tsSections = parseTsSections(content, styleSections);

	const cssContent = createCssContent(fileId, content, styleSections);

	const tsxContent = createTsxContent(fileId, content, styleSections);

	return {
		cssContent,
		tsxContent,
		styleSections,
		tsSections,
	};
}

export function parseStyleSections(content: string, contentOriginal: string) {
	const sections: StyleSection[] = [];
	const len = content.length;
	let pos = 0;
	const rePos = /<style[\s\S]*?>/g;
	const reEnd = /<\/style>/g;

	while (pos < len) {
		pos = indexOfRegex(content, rePos, pos);                      // the       '<' of <style>
		if (pos === -1) {
			break;
		}
		let end = indexOfRegex(content, reEnd, pos);                  // the       '<' of </style>
		if (end === -1) {
			break;
		}

		const stylePos = pos;                                         // the       '<' of <style>
		const styleEnd = content.indexOf(">", end) + 1;               // after the '>' of </style>
		const styleInnerPos = content.indexOf(">", stylePos) + 1;     // after the '>' of <style>
		const styleInnerEnd = content.lastIndexOf("<", styleEnd);     // the       '<' of </style>

		// Classify the style section - either
		// - css <style>...</style>
		// - ts <style>{`...`}</style>

		const [curlyOpen, curlyOpenPos] = findCharFwd(content, styleInnerPos, styleInnerEnd);
		const [backtickOpen, backtickOpenPos] = curlyOpen === "{" ? findCharFwd(content, curlyOpenPos + 1, styleInnerEnd) : ["", -1];
		const [curlyClose, curlyClosePos] = backtickOpen === "`" ? findCharBwd(content, styleInnerEnd - 1, backtickOpenPos + 1) : ["", -1];
		const [backtickClose, backtickClosePos] = curlyClose === "}" ? findCharBwd(content, curlyClosePos - 1, backtickOpenPos + 1) : ["", -1];

		if (backtickClose === "`") {
			// TsStyleSection
			addTsStyleSection(sections, stylePos, styleEnd, styleInnerPos, styleInnerEnd, curlyOpenPos, curlyClosePos, backtickOpenPos, backtickClosePos);
		} else {
			// CssStyleSection

			// Parse inner {``} property values. For example, color: {`...`};
			const tsSections = parseTsCurlySections(content, contentOriginal, styleInnerPos, styleInnerEnd);

			addCssStyleSection(sections, stylePos, styleEnd, styleInnerPos, styleInnerEnd, tsSections);
		}

		pos = styleEnd;
	}
	return sections;
}

function parseTsCurlySections(content: string, contentOriginal: string, start: number, end: number) {
	const sections: TsCurlySection[] = [];
	let pos = start;
	while (pos < end) {
		const section = parseTsCurlySection(content, contentOriginal, pos, end);
		if (section) {
			sections.push(section);
			pos = section.end;
		} else {
			++pos;
		}
	}
	return sections;
}

function parseTsCurlySection(content: string, contentOriginal: string, start: number, end: number) {

	const [quoteOpen, _quoteOpenPos] = findCharFwd(content, start, end);
	let isQuoted = false;
	if (quoteOpen === "\"" || quoteOpen === "'") {
		isQuoted = true;
		++start;

		// If isDoubleQuoted, we must use contentOriginal to find {` and `}
		// because in content all strings are empty and we would not find {` and `}
		// For example:
		// "{`...`}" in contentOriginal is "       " in content

		content = contentOriginal;
	}

	const [curlyOpen, curlyOpenPos] = findCharFwd(content, start, end);

	if (curlyOpen !== "{") return undefined;
	const [backtickOpen, backtickOpenPos] = findCharFwd(content, curlyOpenPos + 1, end);
	if (backtickOpen !== "`") return undefined;

	let backtickClosePos = -1;
	let pos = backtickOpenPos + 1;
	let prev = "";
	while (pos < end) {
		const c = content.charAt(pos);
		if (c === "`" && prev !== "\\") {
			backtickClosePos = pos;
			break;
		}
		prev = c;
		++pos;
	}
	if (backtickClosePos === -1) return undefined;

	const [curlyClose, curlyClosePos] = findCharFwd(content, backtickClosePos + 1, end);
	if (curlyClose !== "}") return undefined;

	if (isQuoted) {
		const [quoteClose, _quoteClosePos] = findCharFwd(content, backtickClosePos + 2, end);
		if (quoteClose !== quoteOpen) return undefined;
	}

	const section: TsCurlySection = {
		type: "ts",
		pos: curlyOpenPos,
		end: curlyClosePos + 1,
		curlyOpenPos,
		curlyClosePos,
		backtickOpenPos,
		backtickClosePos,
		isQuoted: isQuoted,
	};
	return section;
}

function addCssStyleSection(sections: Section[], pos: number, end: number, innerPos: number, innerEnd: number, tsCurlySections: TsCurlySection[]) {
	const section: CssStyleSection = {
		type: "style",
		subType: "css",
		pos,
		end,
		innerPos,
		innerEnd,
		tsCurlySections,
	};
	sections.push(section);
	return section;
}

function addTsStyleSection(sections: Section[], pos: number, end: number, innerPos: number, innerEnd: number, curlyOpenPos: number, curlyClosePos: number, backtickOpenPos: number, backtickClosePos: number) {
	const section: TsStyleSection = {
		type: "style",
		subType: "ts",
		pos,
		end,
		innerPos,
		innerEnd,
		curlyOpenPos,
		curlyClosePos,
		backtickOpenPos,
		backtickClosePos,
		isQuoted: false,
	};
	sections.push(section);
	return section;
}

function parseTsSections(content: string, styleSections: StyleSection[]) {
	const tsSections: TsSection[] = [];

	let pos = 0;
	for (const styleSection of styleSections) {
		if (styleSection.pos > pos) {
			tsSections.push({
				pos: pos,
				end: styleSection.pos,
			});
		}

		if (styleSection.subType === "css") {
			const cssStyleSection = styleSection as CssStyleSection;
			for (const tsCurlySection of cssStyleSection.tsCurlySections) {
				tsSections.push({
					pos: tsCurlySection.pos,
					end: tsCurlySection.end,
				});
			}
		} else
		if (styleSection.subType === "ts") {
			const tsStyleSection = styleSection as TsStyleSection;
			tsSections.push({
				pos: tsStyleSection.innerPos,
				end: tsStyleSection.innerEnd,
			});
		}

		pos = styleSection.end;
	}

	if (pos < content.length) {
		tsSections.push({
			pos: pos,
			end: content.length,
		});
	}

	return tsSections;
}

/**
 * Returns a string that has all '{' and '}' replaced with '"' to make the CSS syntax checker happy.
 * @example
   <style>
     color: {`...`};
   </style>

   becomes

   <style>
     color: "`...`";
   </style>
*/
function createCssContent(fileId: string, content: string, styleSections: StyleSection[]) {
	if (styleSections.length === 0) return content;

	// Positions of all '{' and '}'
	const curlyPositions: number[] = [];
	const curlyOpenPositions: number[] = [];
	const curlyClosePositions: number[] = [];
	for (const styleSection of styleSections) {

		DocumentMetas.addStyleBlockRange(fileId, styleSection.pos, styleSection.end);

		if (styleSection.subType === "css") {
			const cssStyleSection = styleSection as CssStyleSection;
			for (const tsCurlySection of cssStyleSection.tsCurlySections) {
				if (tsCurlySection.isQuoted) continue;
				curlyPositions.push(tsCurlySection.curlyOpenPos);
				curlyPositions.push(tsCurlySection.curlyClosePos);
				curlyOpenPositions.push(tsCurlySection.curlyOpenPos);
				curlyClosePositions.push(tsCurlySection.curlyClosePos);
			}
		}
	}

	if (curlyPositions.length === 0) return content;

	let out = "";
	let pos = 0;
	for (let i = 0; i < curlyPositions.length; ++i) {
		const cp = curlyPositions[i];
		if (cp > pos) {
			out += content.substring(pos, cp);
		}
		out += '"';
		pos = cp + 1;
	}
	if (pos < content.length) {
		out += content.substring(pos);
	}

	DocumentMetas.setCssCurlyPositions(fileId, curlyOpenPositions, curlyClosePositions);

	return out;
}

/**
 * Returns a string that has the following content replaced with semicolons to make the TS syntax checker happy
 * and to avoid invalid auto-imports like "red".
 * - the <style> and </style> tags
 * - everything inside style tags that is not enclosed in {``}
 * @example
   <style xxx>{`
   div {
   	 color: red;
    }
   `}</style>

   becomes

   ;;;;;;;;;;;{`
   div {
     color: red;
    }
   `};;;;;;;;


   <style xxx>
   div {
	 color: red;
	 background: {`blue`};
   }
   </style>

   becomes

   ;;;;;;;;;;;
   ;;; ;
	 ;;;;;; ;;;;
	 ;;;;;;;;;;; {`blue`};
   ;
   ;;;;;;;;
*/
function createTsxContent(fileId: string, content: string, styleSections: StyleSection[]) {
	if (styleSections.length === 0) return content;

	let out = "";
	let pos = 0;
	for (const styleSection of styleSections) {
		if (styleSection.pos > pos) {
			out += content.substring(pos, styleSection.pos);
		}
		// <style xxx>
		const tagOpenLen = styleSection.innerPos - styleSection.pos;
		for (let i = 0; i < tagOpenLen; ++i) {
			out += semicolon(content.charAt(styleSection.pos + i));
		}

		if (styleSection.subType === "ts") {
			// Keep the whole ts content <style xxx>{`...`}</style>
			out += content.substring(styleSection.innerPos, styleSection.innerEnd);
		} else {
			// Replace content with semicolons *except* the {``} sections within content
			const cssStyleSection = styleSection as CssStyleSection;
			out += replaceCssWithSemicolons(content, styleSection.innerPos, styleSection.innerEnd, cssStyleSection.tsCurlySections);
		}

		// </style>
		const tagCloseLen = styleSection.end - styleSection.innerEnd;
		for (let i = 0; i < tagCloseLen; ++i) {
			out += semicolon(content.charAt(styleSection.innerEnd + i));
		}

		pos = styleSection.end;
	}
	out += content.substring(pos);

	return out;
}

function replaceCssWithSemicolons(content: string, start: number, end: number, tsCurlySections: TsCurlySection[]) {
	let out = "";
	let pos = start;
	for (const tsCurlySection of tsCurlySections) {
		// semicolonize before curly section
		for (let i = pos; i < tsCurlySection.pos; ++i) {
			out += semicolon(content.charAt(i));
		}
		// add curly section
		out += content.substring(tsCurlySection.pos, tsCurlySection.end);
		pos = tsCurlySection.end;
	}
	// semicolonize after last curly section
	for (let i = pos; i < end; ++i) {
		out += semicolon(content.charAt(i));
	}
	return out;
}

/** If c is not a whitespace char then ";" is returned. Otherwise the char is returned. */
function semicolon(c: string) {
	return c === " " || c === "\t" || c === "\r" || c === "\n" ? c : ";";
}

function indexOfRegex(s: string, re: RegExp, position: number) {
	const ind = (position === 0 ? s : s.slice(position)).search(re);
	return ind < 0 ? ind : position + ind;
}
