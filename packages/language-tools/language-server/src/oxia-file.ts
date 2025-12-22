import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type * as ts from "typescript";
import { DocumentMetas } from "./document-meta.js";
import { parseDocument } from "./document-parser.js";

export interface OxiaFile extends VirtualCode {
	id: string;
	languageId: string;
	snapshot: ts.IScriptSnapshot;
	mappings: CodeMapping[];
	embeddedCodes: VirtualCode[];
}

export function parseOxiaFile(fileName: string, snapshot: ts.IScriptSnapshot): OxiaFile {
	const fileId = fileName.replaceAll("\\", "/");

	DocumentMetas.reset(fileId);

	const content = snapshot.getText(0, snapshot.getLength());

	const { cssContent, tsxContent, tsxTagContent, styleSections } = parseDocument(fileId, content);

	// console.log("----------------------------- TSX ----------------------------------");
	// console.log(tsxContent);
	// console.log("--------------------------------------------------------------------");

	const embeddedCodes: VirtualCode[] = [];

	// Virtual css codes for style sections' inner content: <style ...>*THIS*</style>
	for (let i = 0; i < styleSections.length; ++i) {
		const styleSection = styleSections[i];

		const isRealCss = styleSection.subType === "css";

		const { innerPos, innerEnd } = styleSection;

		const virtualCode: VirtualCode = {
			id: `css_${i}`,
			languageId: "css",
			snapshot: {
				getText: (start, end) => cssContent.substring(innerPos + start, innerPos + end),
				getLength: () => innerEnd - innerPos,
				getChangeRange: () => undefined,
			},
			mappings: [{
				sourceOffsets: [innerPos],
				generatedOffsets: [0],
				lengths: [innerEnd - innerPos],
				data: {
					verification: isRealCss,
					// NOTE maybe we could have both CSS and TS completions? First attempt failed...
					// completion: isRealCss makes typescript completion work, but CSS completion not work in CSS section with subType "ts"
					// completion: true makes CSS completion work, but typescript completion not work in CSS section with subType "ts"
					// completion: isRealCss,
					completion: true,
					semantic: true,
					navigation: isRealCss, // Makes the TS navigation work when inside a CSS section with subType "ts"
					structure: true,
					format: isRealCss,
				},
			}],
			embeddedCodes: [],
		};
		embeddedCodes.push(virtualCode);
	}


	// Virtual tsx code for style start and end tags: <style ...> </style>
	// This enables code completion in tags: <style *HERE*>
	for (let i = 0; i < styleSections.length; ++i) {
		const styleSection = styleSections[i];

		const { pos: startTagPos, end: endTagEnd } = styleSection;

		const virtualCode: VirtualCode = {
			id: `style_tag_${i}`,
			languageId: "typescriptreact",
			snapshot: {
				getText: (start, end) => tsxTagContent.substring(startTagPos + start, startTagPos + end),
				getLength: () => endTagEnd - startTagPos,
				getChangeRange: () => undefined,
			},
			mappings: [{
				sourceOffsets: [startTagPos],
				generatedOffsets: [0],
				lengths: [endTagEnd - startTagPos],
				data: {
					verification: true,
					completion: true,
					semantic: false,
					navigation: false,
					structure: false,
					format: false,
				},
			}],
			embeddedCodes: [],
		};
		embeddedCodes.push(virtualCode);
	}


	// Create root
	return {
		id: "root",
		languageId: "typescriptreact",
		snapshot: {
			getText: (start, end) => tsxContent.substring(start, end),
			getLength: () => tsxContent.length,
			getChangeRange: () => undefined,
		},
		mappings: [
		{
			sourceOffsets: [0],
			generatedOffsets: [0],
			lengths: [tsxContent.length],

			data: {
				verification: true,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: true,
			}
		}
		],
		embeddedCodes,
	};
}
