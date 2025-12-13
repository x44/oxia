import chalk from "chalk";
import { basename } from "path";
import { argv } from "process";

export function errorArgs(args: string[], msg: string) {
	console.log();
	console.log(chalk.red(msg));
	console.log();
	console.log([basename(argv[1]), ...args].join(" "));
	process.exit(1);
}

export function errorExit(...msgs: string[]) {
	console.log();
	console.log(chalk.red(msgs.join(" ")));
	process.exit(1);
}

