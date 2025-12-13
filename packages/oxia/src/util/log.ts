import chalk from "chalk";

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
	TRACE = 4,
}

export class Log {
	private static level = LogLevel.INFO;

	private static out = process.stdout;

	static getLevel() {
		return Log.level;
	}

	static setLevel(level: LogLevel) {
		Log.level = level;
	}

	static log(...args: any[]) {
		let s = stringify(...args);
		Log.writeln(s);
	}

	static success(...args: any[]) {
		let s = stringify(...args);
		Log.writeln(chalk.green(`${s}`));
	}

	static mark(...args: any[]) {
		let s = stringify(...args);
		Log.writeln(chalk.bgYellow.black(` ${s} `));
	}

	static todo(...args: any[]) {
		let s = stringify(...args);
		Log.writeln(chalk.bgMagenta.white(` TODO ${s} `));
	}

	static error(...args: any[]) {
		if (Log.level < LogLevel.ERROR) return;
		let s = stringify(...args);
		Log.writeln(chalk.red(s));
	}

	static warn(...args: any[]) {
		if (Log.level < LogLevel.WARN) return;
		let s = stringify(...args);
		Log.writeln(chalk.magenta(s));
	}

	static info(...args: any[]) {
		if (Log.level < LogLevel.INFO) return;
		let s = stringify(...args);
		Log.writeln(chalk.blue(s));
	}

	static debug(...args: any[]) {
		if (Log.level < LogLevel.DEBUG) return;
		let s = stringify(...args);
		Log.writeln(chalk.gray(s));
	}

	static trace(...args: any[]) {
		if (Log.level < LogLevel.TRACE) return;
		let s = stringify(...args);
		Log.writeln(chalk.gray(s));
	}

	static writeln(s: string) {
		Log.out.write(s);
		Log.out.write("\n");
	}

	static write(s: string) {
		Log.out.write(s);
	}
}

function stringify(...args: any[]): string {
	return args.map(a => {
		if (a === undefined) return "undefined";
		if (a === null) return "null";
		if (a instanceof Error) return `${a.stack}`;
		if (a instanceof Map) return JSON.stringify([...a.entries()]);
		if (a instanceof Set) return JSON.stringify([...a.values()]);
		if (typeof a === "object") {
			return JSON.stringify(a, null, "  ");
		}
		return a;
	}).join(" ");
}
