export function isHelpArg(arg: string) {
	return arg === ("-?") || arg === ("--?") || arg === ("-help") || arg === ("--help");
}

export function hasHelpArg() {
	for (let i = 2; i < process.argv.length; ++i) {
		if (isHelpArg(process.argv[i])) return true;
	}
	return false;
}
