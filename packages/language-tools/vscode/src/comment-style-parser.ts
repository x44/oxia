type StyleSection = {
	start: number;
	end: number;
}

export function extractStyleSections(content: string): [string, StyleSection[]] {
	const len = content.length;
	let pos = 0;
	let contentNoCommentsEmptyStrings = "";

	while (pos < len) {
		const c = content.charAt(pos);
		const next = content.charAt(pos + 1);

		if (c === "/" && next === "/") {
			singleComment();
		} else
		if (c === "/" && next === "*") {
			multiComment();
		} else
		if (c === "'") {
			stringLiteral("'");
		} else
		if (c === "\"") {
			stringLiteral("\"");
		} else
		if (c === "`") {
			stringLiteral("`");
		} else {
			contentNoCommentsEmptyStrings += c;
			++pos;
		}
	}

	const styleSections = parseStyleSections(contentNoCommentsEmptyStrings);

	return [
		contentNoCommentsEmptyStrings,
		styleSections
	];

	function singleComment() {
		contentNoCommentsEmptyStrings += "  ";
		pos += 2; // skip "//"
		while (pos < len) {
			const c = content.charAt(pos);
			const w = whitespace(c);
			contentNoCommentsEmptyStrings += w;
			if (c === "\n") {
				++pos; // skip "\n"
				break;
			}
			++pos;
		}
	}

	function multiComment() {
		contentNoCommentsEmptyStrings += "  ";
		pos += 2; // skip "/*"
		let prev = "";
		while (pos < len) {
			const c = content.charAt(pos);
			const w = whitespace(c);
			contentNoCommentsEmptyStrings += w;
			if (c === "/" && prev === "*") {
				++pos; // skip "/"
				break;
			}
			prev = c;
			++pos;
		}
	}

	function stringLiteral(quote: string) {
		contentNoCommentsEmptyStrings += quote;
		pos += 1; // skip quote
		let prev = "";
		while (pos < len) {
			const c = content.charAt(pos);
			if (c === quote && prev !== "\\") {
				contentNoCommentsEmptyStrings += quote;
				++pos; // skip quote
				break;
			}
			contentNoCommentsEmptyStrings += whitespace(c);
			prev = c;
			++pos;
		}
	}

	function parseStyleSections(content: string) {
		const sections: StyleSection[] = [];
		const len = content.length;
		let pos = 0;
		const reStart = /<style[\s\S]*?>/g;
		const reEnd = /<\/style>/g;

		while (pos < len) {
			pos = indexOfRegex(content, reStart, pos);                    // the       '<' of <style>
			if (pos === -1) {
				break;
			}
			let end = indexOfRegex(content, reEnd, pos);                  // the       '<' of </style>
			if (end === -1) {
				break;
			}

			const styleStart = pos;                                       // the       '<' of <style>
			const styleEnd = content.indexOf(">", end) + 1;               // after the '>' of </style>

			sections.push({
				start: styleStart,
				end: styleEnd,
			});

			pos = styleEnd;
		}
		return sections;
	}
}

/** If c is not a whitespace char then " " is returned. Otherwise the char is returned. */
function whitespace(c: string) {
	return c === " " || c === "\t" || c === "\r" || c === "\n" ? c : " ";
}

function indexOfRegex(s: string, re: RegExp, position: number) {
	const ind = (position === 0 ? s : s.slice(position)).search(re);
	return ind < 0 ? ind : position + ind;
}
