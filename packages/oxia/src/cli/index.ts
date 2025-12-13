import { argv } from "node:process";
import Main from "../build/index.js";
import { OxiaLoader } from "../loader/OxiaLoader.js";
import { MemFs } from "../memfs/MemFs.js";
import { isHelpArg } from "../util/args.js";
import { Log } from "../util/log.js";

// Let OxiaLoader take over
const fs = new MemFs();
const loader = new OxiaLoader(fs);
loader.register();

function printHelpAndExit(code: number) {
	Log.log(`oxia <CMD>`);

	Log.log("\nCMD\n");
	Log.log("dev      Start dev mode.");
	Log.log("build    Build for production.");

	Log.log("\nrun oxia <CMD> --help for command specific help.\n");

	process.exit(code);
}

async function main() {
	const cmd = argv[2];

	if (isHelpArg(cmd)) {
		printHelpAndExit(0);
	}

	// Remove the command from argv
	process.argv = [
		...process.argv.slice(0, 2),
		...process.argv.slice(3),
	];

	switch (cmd) {
		case "dev":
		case "build":
			await Main(cmd);
		break;

		default: {
			Log.error("missing command\n");
			printHelpAndExit(1);
		}
	}
}

await main();
