export function uuid() {
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
		(+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
	);
}

const letters = "abcdefghijklmnopqrstuvwxyz";
const base = letters.length;
export function enc26(n: number) {
	if (n == 0) return letters[0];
	let s = "";
	while (n > 0) {
		const d = n % base;
		n = Math.trunc(n / base);
		s = letters[d] + s;
	}
	return s;
}
