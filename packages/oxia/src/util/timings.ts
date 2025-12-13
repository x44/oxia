import chalk from "chalk";
import { Log } from "./log.js";

type Timing = {
	name: string;
	begin: number;
	duration: number;
	callCount: number;
	parent: Timing | undefined;
	children: Timing[];
}

type MaxStringLengths = {
	maxNameLen: number;
	maxDurationLen: number;
	maxCallCountLen: number;
	maxAvgDurationLen: number;
}

/**
 * @example
 * // Print after each top level timing
 * Timings.reset();
 *
 * // Optionally set top level timing names to get equal print widths
 * Timings.add(`building route index`);
 * Timings.add(`building route about/index`);
 *
 * Timings.begin(`building route index`);
 *
 * 	Timings.begin("convert tsx");
 * 		await sleep(80);
 * 	Timings.end();
 *
 * 	Timings.begin("convert html");
 * 		await sleep(100);
 * 	Timings.end();
 *
 * Timings.end();
 *
 * Timings.printOne(-1);
 *
 * Timings.begin(`building route about/index`);
 *
 * 	Timings.begin("convert tsx");
 * 		await sleep(100);
 * 	Timings.end();
 *
 * 	Timings.begin("convert html");
 * 		await sleep(100);
 * 		Timings.begin("format");
 * 			await sleep(100);
 * 		Timings.end();
 * 	Timings.end();
 *
 * Timings.end();
 *
 * Timings.printOne(-1);
 *
 * Timings.printSum();
 *
 * @example
 * // Print after all top level timings
 * Timings.reset();
 *
 * Timings.begin(`building route index`);
 *
 * 	Timings.begin("convert tsx");
 * 		await sleep(80);
 * 	Timings.end();
 *
 * 	Timings.begin("convert html");
 * 		await sleep(100);
 * 	Timings.end();
 *
 * Timings.end();
 *
 * Timings.begin(`building route about/index`);
 *
 * 	Timings.begin("convert tsx");
 * 		await sleep(100);
 * 	Timings.end();
 *
 * 	Timings.begin("convert html");
 * 		await sleep(100);
 * 		Timings.begin("format");
 * 			await sleep(100);
 * 		Timings.end();
 * 	Timings.end();
 *
 * Timings.end();
 *
 * Timings.printAll(-1);
 * Timings.printSum();
 *
 */
export class Timings {
	private static root: Timing = Timings.addChild("root", undefined);
	private static current = this.root;
	private static lastEnded?: Timing = undefined;

	private static printRootsWithEqualWidths = false;
	private static printCallCountAndAvgDuration = true;
	private static decimalDigits = 2;

	private static nameStyles = [
		[chalk.blue, chalk.white],     // depth 0 - name parts
		[chalk.gray],                  // depth 1 - name parts
	];

	private static durationStyles = [
		chalk.greenBright,             // depth 0
		chalk.white,                   // depth 1
	];

	private static durationUnitStyles = [
		chalk.green.dim,               // depth 0
		chalk.gray.dim,                // depth 1
	];

	private static sumNameStyle = chalk.greenBright;
	private static sumDurationStyle = chalk.greenBright;
	private static sumDurationUnitStyle = chalk.green.dim;


	static reset() {
		this.root.children.length = 0;
		this.current = this.root;
		this.lastEnded = undefined;
	}

	/**
	 * Call this after reset to get equal name lengths when printing the top level timings.
	 * Otherwise each top level timing will be printed with it's actual name length.
	 * This method has no other effect beside the print formatting.
	 */
	static add(name: string) {
		this.getOrAddChild(name, this.current);
	}

	static begin(name: string) {
		const timing = this.getOrAddChild(name, this.current);
		timing.begin = performance.now();
		++timing.callCount;
		this.current = timing;
	}

	static end() {
		const now = performance.now();
		this.lastEnded = this.current;
		this.current.duration += now - this.current.begin;
		this.current = this.current.parent!;
	}

	/** Prints the last timing on which end() was called. */
	static printOne(maxDepth: number) {
		const maxStringLengths = this.getMaxStringLengths(this.printRootsWithEqualWidths ? this.root : undefined);
		this.printTree(this.lastEnded!, maxStringLengths, maxDepth);
	}

	/** Prints all timings. */
	static printAll(maxDepth: number) {
		const maxStringLengths = this.getMaxStringLengths(this.printRootsWithEqualWidths ? this.root : undefined);
		for (let i = 0; i <this.root.children.length; ++i) {
			const child = this.root.children[i];
			this.printTree(child, maxStringLengths, maxDepth);
		}
	}

	/** Prints the sum only. */
	static printSum(text = "Completed in") {
		const durationSum = this.root.children.reduce((sum, child) => sum + child.duration, 0);
		const maxStringLengths = this.getMaxStringLengths(undefined);
		this.printDuration(text, durationSum, 1, maxStringLengths, -1, [], false);
	}

	private static printTree(timing: Timing, maxStringLengths: MaxStringLengths, maxDepth: number, curDepth = 0, depthInsets: boolean[] = [], isLast = false) {
		if (depthInsets.length < curDepth) depthInsets.push(true);

		this.printDuration(timing.name, timing.duration, timing.callCount, maxStringLengths, curDepth, depthInsets, isLast);

		if (maxDepth >= 0 && curDepth >= maxDepth) return;

		maxStringLengths = this.getMaxStringLengths(timing);

		for (let i = 0; i < timing.children.length; ++i) {
			const isLast = i === timing.children.length - 1;
			if (isLast) {
				depthInsets[curDepth] = false;
			}
			const child = timing.children[i];
			this.printTree(child, maxStringLengths, maxDepth, curDepth + 1, depthInsets, isLast);
		}
	}

	private static printDuration(name: string, duration: number, callCount: number, maxStringLengths: MaxStringLengths, curDepth: number, depthInsets: boolean[], isLast: boolean) {
		// const instr = "  ".repeat(Math.max(0, curDepth));

		let instr = "";
		for (let i = 0; i < curDepth - 1; ++i) {
			if (depthInsets[i]) {
				instr += "│  ";
			} else {
				instr += "   ";
			}
		}
		if (curDepth > 0) {
			if (!isLast) {
				instr += "├► ";
			} else {
				instr += "└► ";
			}
		}
		instr = chalk.gray(instr);

		let nameStr = name;
		const namePad = Math.max(0, maxStringLengths.maxNameLen - nameStr.length);
		nameStr = this.applyNameStyle(nameStr, curDepth);

		nameStr += " ".repeat(namePad);

		let durationStr = this.durationToString(duration, curDepth);
		durationStr = durationStr.padStart(maxStringLengths.maxDurationLen, " ");
		durationStr = this.applyDurationStyle(durationStr, curDepth);

		let unitStr = "ms";
		unitStr = this.applyDurationUnitStyle(unitStr, curDepth);

		let extStr = "";
		if (this.printCallCountAndAvgDuration && curDepth > 0 && callCount > 1) {
			let callCountStr = callCount.toString();
			callCountStr = callCountStr.padStart(maxStringLengths.maxCallCountLen, " ");
			callCountStr += " x ";
			callCountStr = chalk.gray(callCountStr);

			let avgDurationStr = this.durationToString(duration / callCount, curDepth);
			avgDurationStr = avgDurationStr.padStart(maxStringLengths.maxAvgDurationLen, " ");
			avgDurationStr = chalk.white(avgDurationStr);

			let avgUnitStr = "ms";
			avgUnitStr = chalk.gray.dim(avgUnitStr);

			extStr = ` ${callCountStr}${avgDurationStr}${avgUnitStr}`;
		}

		Log.writeln(`${instr}${nameStr} ${durationStr}${unitStr}${extStr}`);
	}

	private static applyNameStyle(str: string, curDepth: number) {
		if (curDepth === -1) return this.sumNameStyle(str);
		const strs = str.split(" ");
		for (let i = 0; i < strs.length; ++i) {
			const di = Math.min(curDepth, this.nameStyles.length - 1);
			const si = Math.min(i, this.nameStyles[di].length - 1);
			strs[i] = this.nameStyles[di][si](strs[i]);
		}
		return strs.join(" ");
	}

	private static applyDurationStyle(str: string, curDepth: number) {
		if (curDepth === -1) return this.sumDurationStyle(str);
		const di = Math.min(curDepth, this.durationStyles.length - 1);
		return this.durationStyles[di](str);
	}

	private static applyDurationUnitStyle(str: string, curDepth: number) {
		if (curDepth === -1) return this.sumDurationUnitStyle(str);
		const di = Math.min(curDepth, this.durationUnitStyles.length - 1);
		return this.durationUnitStyles[di](str);
	}

	private static getOrAddChild(name: string, parent: Timing) {
		const child = parent.children.find(c => c.name === name);
		if (child) return child;
		return this.addChild(name, parent);
	}

	private static addChild(name: string, parent: Timing | undefined): Timing {
		const timing: Timing = {
			name,
			begin: 0,
			duration: 0,
			callCount: 0,
			parent,
			children: [],
		};
		parent?.children.push(timing);
		return timing;
	}

	private static getMaxStringLengths(parent: Timing | undefined): MaxStringLengths {
		if (!parent) {
			return {
				maxNameLen: 0,
				maxDurationLen: 0,
				maxCallCountLen: 0,
				maxAvgDurationLen: 0,
			};
		}
		return {
			maxNameLen: parent.children.reduce((max, child) => Math.max(max, child.name.length), 0),
			maxDurationLen: parent.children.reduce((max, child) => Math.max(max, this.durationToString(child.duration, 1).length), 0),
			maxCallCountLen: parent.children.reduce((max, child) => Math.max(max, child.callCount.toString().length), 0),
			maxAvgDurationLen: parent.children.reduce((max, child) => Math.max(max, this.durationToString(child.duration / child.callCount, 1).length), 0),
		};
	}

	private static durationToString(duration: number, depth: number) {
		return duration.toFixed(depth <= 0 ? 0 : this.decimalDigits);
	}
}
