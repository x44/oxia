import { SET_STYLE_RESULT_FUNCTION } from "../oxia2tsx/types.js";

/** Key: ResultId, Val: Result */
const map = new Map<string, string>();

function setStyleResult(id: string, result: string) {
	map.set(id, result);
}

(globalThis as any)[SET_STYLE_RESULT_FUNCTION] = setStyleResult;

export function getStyleResult(id: string) {
	const result = map.get(id)!;
	map.delete(id);
	return result;
}
