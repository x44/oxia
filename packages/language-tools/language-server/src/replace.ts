export type Range = {
	pos: number;
	end: number;
}

/** Replaces in src all non-whitespace chars that are inside of the given ranges with the given char. */
export function replaceInsideOfRanges(src: string, char: string, ranges: Range[]) {
	let out = "";
	let pos = 0;
	for (const range of ranges) {
		if (range.pos > pos) out += src.substring(pos, range.pos);
		for (pos = range.pos; pos < range.end; ++pos) {
			const c = src.charAt(pos);
			out += c === " " || c === "\t" || c === "\r" || c === "\n" ? c : char;
		}
	}
	if (pos < src.length) out += src.substring(pos);
	return out;
}

/** Replaces in src all non-whitespace chars that are outside of the given ranges with the given char. */
export function replaceOutsideOfRanges(src: string, char: string, ranges: Range[]) {
	let out = "";
	let pos = 0;
	for (const range of ranges) {
		for (; pos < range.pos; ++pos) {
			const c = src.charAt(pos);
			out += c === " " || c === "\t" || c === "\r" || c === "\n" ? c : char;
		}
		out += src.substring(range.pos, range.end);
		pos = range.end;
	}
	for (; pos < src.length; ++pos) {
		const c = src.charAt(pos);
		out += c === " " || c === "\t" || c === "\r" || c === "\n" ? c : char;
	}
	return out;
}
