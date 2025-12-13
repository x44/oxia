type State = {
	content: string;
	len: number;
	pos: number;

	out: string[];
}

export function blankCommentsAndStrings(content: string) {
	const state: State = {
		content,
		len: content.length,
		pos: 0,

		out: [],
	}

	while (state.pos < state.len) {
		const c = content[state.pos];
		const n = state.pos < state.len - 1 ? state.content[state.pos + 1] : "";

		if (c === "/" && n === "/") {
			singleComment(state);
		}
		else if (c === "/" && n === "*") {
			multiComment(state);
		}
		else if (c === "\"") {
			stringLiteral(state, "\"");
		}
		else if (c === "'") {
			stringLiteral(state, "'");
		}
		else if (c === "`") {
			stringLiteral(state, "`");
		}
		else {
			state.out.push(c);
			++state.pos;
		}
	}

	return state.out.join("");
}

export function blankCssComments(content: string) {
	const state: State = {
		content,
		len: content.length,
		pos: 0,

		out: [],
	}

	while (state.pos < state.len) {
		const c = content[state.pos];
		const n = state.pos < state.len - 1 ? state.content[state.pos + 1] : "";

		if (c === "/" && n === "*") {
			multiComment(state);
		}
		else {
			state.out.push(c);
			++state.pos;
		}
	}

	return state.out.join("");
}

function singleComment(state: State) {
	state.out.push(" "); // '/'
	state.out.push(" "); // '/'
	state.pos += 2;
	while (state.pos < state.len) {
		const c = state.content[state.pos++];
		if (c === "\n") {
			state.out.push(c);
			break;
		}
		state.out.push(" ");
	}
}

function multiComment(state: State) {
	state.out.push(" "); // '/'
	state.out.push(" "); // '*'
	state.pos += 2;
	while (state.pos < state.len) {
		const c = state.content[state.pos++];
		const n = state.pos < state.len ? state.content[state.pos] : "";
		if (c === "\r" || c === "\n") {
			state.out.push(c);
			continue;
		}
		if (c === "*" && n === "/") {
			state.out.push(" "); // '*'
			state.out.push(" "); // '/'
			++state.pos;
			break;
		}
		state.out.push(" ");
	}
}

function stringLiteral(state: State, quote: "\"" | "'" | "`") {
	state.out.push(" "); // quote
	++state.pos;
	let prev = "";
	while (state.pos < state.len) {
		const c = state.content[state.pos++];
		if (c === quote && prev !== "\\") {
			state.out.push(" "); // quote
			break;
		}
		state.out.push(" ");
		prev = c;
	}
}

export function whitespaceOnly(s: string) {
	let out = "";
	const len = s.length;
	for (let i = 0; i < len; ++i) {
		const c = s.charAt(i);
		if (c === "\t" || c === "\r" || c === "\n") {
			out += c;
		} else {
			out += " ";
		}
	}
	return out;
}

export function removeEmptyLines(s: string) {
	if (s.length === 0) return s;
	const a = s.split("\n");
	const out: string[] = [];
	for (let i = 0; i < a.length; ++i) {
		const l = a[i];
		if (l.length === 0 || l.trim().length === 0) continue;
		out.push(l);
	}
	return out.join("\n");
}

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
