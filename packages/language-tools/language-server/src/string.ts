type CharAndPos = [string | undefined, number];

/** Finds the next non-whitespace char. Search starts *at* from and ends *before* to. */
export function findCharFwd(s: string, from: number, to: number): CharAndPos {
	for (let i = from; i < to; ++i) {
		const c = s.charAt(i);
		if (c === " " || c === "\t" || c === "\r" || c === "\n") continue;
		return [c, i];
	}
	return [undefined, -1];
}

/** Finds the previous non-whitespace char. Search starts *at* from and ends *at* to. */
export function findCharBwd(s: string, from: number, to: number): CharAndPos {
	for (let i = from; i >= to; --i) {
		const c = s.charAt(i);
		if (c === " " || c === "\t" || c === "\r" || c === "\n") continue;
		return [c, i];
	}
	return [undefined, -1];
}

export function blankCommentsAndStrings(content: string) {
	const len = content.length;
	let pos = 0;
	let out = "";

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
			out += c;
			++pos;
		}
	}

	return out;

	function singleComment() {
		out += "  ";
		pos += 2; // skip "//"
		while (pos < len) {
			const c = content.charAt(pos);
			const w = whitespace(c);
			out += w;
			if (c === "\n") {
				++pos; // skip "\n"
				break;
			}
			++pos;
		}
	}

	function multiComment() {
		out += "  ";
		pos += 2; // skip "/*"
		let prev = "";
		while (pos < len) {
			const c = content.charAt(pos);
			const w = whitespace(c);
			out += w;
			if (c === "/" && prev === "*") {
				++pos; // skip "/"
				break;
			}
			prev = c;
			++pos;
		}
	}

	function stringLiteral(quote: string) {
		out += quote;
		pos += 1; // skip quote
		let prev = "";
		while (pos < len) {
			const c = content.charAt(pos);
			if (c === quote && prev !== "\\") {
				out += quote;
				++pos; // skip quote
				break;
			}
			out += whitespace(c);
			prev = c;
			++pos;
		}
	}
}

/** If c is not a whitespace char then " " is returned. Otherwise the char is returned. */
function whitespace(c: string) {
	return c === " " || c === "\t" || c === "\r" || c === "\n" ? c : " ";
}
