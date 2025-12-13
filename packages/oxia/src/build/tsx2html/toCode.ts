export function toCode(html: string) {
	if (html.startsWith("<!DOCTYPE html>")) {
		html = html.substring("<!DOCTYPE html>".length);
	}
	while (html.startsWith("\n") || html.startsWith("\r") || html.startsWith("\t") || html.startsWith(" ")) html = html.substring(1);
	html = html.replace(/<(.*?)>/gm, `<span style="color: #00b0ff;">&lt;$1&gt;</span>`);

	// html = html.replace(/(&lt;.*?)(data-[a-z,0-9,\-]*)(.*?&gt;)/gm, `$1<span style="color: #80ffff;">$2</span>$3`);
	html = html.replace(/(data-[a-z,A-Z,0-9,\-,_]*)/gm, `<span style="color: #80e0c0;">$1</span>`);

	html = html.replace(/(\/\*.*?\*\/)/gm, `<span style="color: #8080ff;">$1</span>`);

	html = html.replace(/\n/gm, "<br>");

	html = `<html><head></head><body style="background: #202020; color: #a08000; font-family: monospace; white-space: pre;">` + html + `</body></html>`;
	return html;
}
