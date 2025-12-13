import chalk, { type ChalkInstance } from "chalk";
import * as readline from "readline";
import { cursor } from "sisteransi";
import { ReadStream, WriteStream } from "tty";

/**
 * @example
 * export async function term() {
 * 	const term = new Term();
 *
 * 	term.onCancel(() => {
 * 		console.log("aborted");
 * 		process.exit(0);
 * 	});
 *
 * 	const projectNameWidget = new InputWidget(term, { title: "Project Name", minLen: 1, maxLen: 32, placeholder: "Project name or '.'" });
 * 	await term.setWidget(projectNameWidget);
 * 	const projectName = projectNameWidget.getText();
 *
 * 	const templateNameWidget = new SelectWidget(term, { title: "Choose Template", multi: false, dir: "ver", items: ["Template one", "Template two"] });
 * 	await term.setWidget(templateNameWidget);
 * 	const templateName = templateNameWidget.getSelectedItem()!;
 *
 * 	const dependenciesWidget = new SelectWidget(term, { title: "Install Dependencies", multi: false, dir: "hor", items: ["YES", "NO"] });
 * 	await term.setWidget(dependenciesWidget);
 * 	const dependencies = dependenciesWidget.getSelectedItem() === "YES";
 *
 *
 * 	const tasks: Task[] = [
 * 		{
 * 			text: "Init project",
 * 			state: "pending",
 * 		},
 * 		{
 * 			text: "Copy template",
 * 			state: "pending",
 * 		},
 * 		{
 * 			text: "Install dependencies",
 * 			state: "pending",
 * 		}
 * 	];
 *
 * 	const taskWidget = new TaskWidget(term, { title: "Progress", tasks: tasks });
 * 	const promise = term.setWidget(taskWidget);
 *
 * 	task0(tasks[0]);
 * 	task1(tasks[1]);
 * 	task2(tasks[2]);
 *
 * 	const result = await promise;
 *
 * 	if (result === "error") {
 * 		const messageWidget = new MessageWidget(term, { title: "Error", active: true, items: [
 * 			`${chalk.red("Something didn't go so well!")}`,
 * 		] });
 * 		term.setWidget(messageWidget);
 * 	} else
 * 	if (result === "done") {
 * 		const messageWidget = new MessageWidget(term, { title: "Done", active: true, items: [
 * 			`You can now run your project with`,
 * 			``,
 * 			`${chalk.blue("cd project")}`,
 * 			`${chalk.blue("pnpm dev")}`,
 * 		] });
 * 		term.setWidget(messageWidget);
 * 	}
 *
 * 	term.close();
 *
 * 	console.log("projecName  ", projectName);
 * 	console.log("templateName", templateName);
 * 	console.log("dependencies", dependencies);
 * }
 *
 * async function task0(task: Task) {
 * 	task.state = "running";
 *
 * 	for (let i = 0; i < 10; ++i) {
 * 		await new Promise(resolve => setTimeout(resolve, 100));
 * 	}
 *
 * 	task.state = "success";
 * }
 *
 * async function task1(task: Task) {
 * 	task.state = "running";
 *
 * 	let sum = 0;
 * 	for (let i = 0; i < 50000000; ++i) {
 * 		sum += Math.sqrt(Math.sin(i) * Math.sqrt(Math.cos(i)));
 * 	}
 * 	task.state = "success";
 * }
 *
 * async function task2(task: Task) {
 * 	task.state = "running";
 *
 * 	await new Promise(resolve => setTimeout(resolve, 1000));
 *
 * 	// task.state = "failed";
 * 	task.state = "success";
 * }
 *
 */
export class Term {
	private rl;
	protected in: ReadStream;
	protected out: WriteStream;
	private widget?: TermWidget;
	private cancelHandler?: () => void;

	constructor() {
		this.in = process.stdin;
		this.out = process.stdout;

		this.rl = readline.createInterface({
			input: this.in,
		});
		readline.emitKeypressEvents(this.in, this.rl);
		if (this.in.isTTY) this.in.setRawMode(true);

		const keyListener = (s, key) => {
			if (this.in.isTTY) this.in.setRawMode(true);

			if (key.ctrl) {
				if (key.name === 'c' || key.name === 'd') {
					this.cancel();
				}
				return;
			}

			if (key.name === "escape") {
				this.cancel();
				return;
			}

			if (!this.widget) return;

			if (key.name === "up") {
				this.widget.onUp();
			} else
			if (key.name === "down") {
				this.widget.onDown();
			} else
			if (key.name === "left") {
				this.widget.onLeft();
			} else
			if (key.name === "right") {
				this.widget.onRight();
			} else
			if (key.name === "home") {
				this.widget.onHome();
			} else
			if (key.name === "end") {
				this.widget.onEnd();
			} else
			if (key.name === "backspace") {
				this.widget.onBackspace();
			} else
			if (key.name === "delete") {
				this.widget.onDelete();
			} else
			if (key.name === "insert") {
				this.widget.onInsert();
			} else
			if (key.name === "space") {
				this.widget.onSpace();
			} else
			if (key.name === "escape") {
				this.widget.onEscape();
			} else
			if (key.name === "return") {
				this.widget.onEnter();
			} else {
				this.widget.onKey(s, key);
			}

			this.widget.render();
		};
		this.in.on("keypress", keyListener);

		this.rl.on("close", () => {
			this.out.write(cursor.show);
			this.in.removeListener("keypress", keyListener);
			if (this.in.isTTY) this.in.setRawMode(false);
			this.rl.close();
		});

		this.out.write(cursor.hide);
	}

	private cancel() {
		this.close();
		console.log();
		if (this.cancelHandler) this.cancelHandler();
	}

	onCancel(handler: () => void) {
		this.cancelHandler = handler;
	}

	close() {
		if (this.widget) {
			this.widget.cancel();
			this.widget = undefined;
		}
		this.rl.close();
	}

	getOut() {
		return this.out;
	}

	setWidget(widget: TermWidget) {
		if (!this.widget) {
			this.out.write("\n");
		}
		return new Promise<WidgetResult>(resolve => {
			this.widget = widget;
			this.widget.start(resolve);
			this.widget.render();
		});
	}
}

type WidgetOptions = {
	title: string;
	alwaysActive?: boolean;
	autoNewlines?: boolean
}

export type WidgetResult = "done" | "error" | "cancel";

export abstract class TermWidget {
	protected out: WriteStream;
	protected isFirstRender = true;
	protected title;
	protected alwaysActive = false;
	protected autoNewlines = true;
	protected didNewlines = false;
	protected pad = 2;
	protected contentW = 0;
	protected contentH = 0;
	protected active = false;
	protected done = false;
	protected resolve: (value: WidgetResult | PromiseLike<WidgetResult>) => void;

	private titleStyleActive = chalk.bgBlue.white.bold;
	private titleStyleInActive = chalk.bgWhite.black;
	// private textStyleActive = chalk.bgGray.whiteBright;
	private textStyleActive = chalk.bgWhite.black;
	private textStyleInActive = chalk.bgGray.black;

	private highStyleActive = chalk.bgBlue.whiteBright;
	private highStyleInActive = this.textStyleInActive.whiteBright;

	constructor(term: Term, options: WidgetOptions) {
		this.out = term.getOut();
		this.title = options.title;
		this.alwaysActive = options.alwaysActive ?? false;
		this.autoNewlines = options.autoNewlines ?? true;
	}

	start(resolve: (value: WidgetResult | PromiseLike<WidgetResult>) => void) {
		this.active = true;
		this.resolve = resolve;
	}

	cancel() {
		this.active = false;
		this.render();
		this.resolve("cancel");
	}

	renderActive() {
		return this.active || this.alwaysActive;
	}

	render() {}
	protected renderContent(out: WriteStream, w: number, pad: number) {}

	onUp() {}
	onDown() {}
	onLeft() {}
	onRight() {}
	onHome() {}
	onEnd() {}
	onBackspace() {}
	onDelete() {}
	onInsert() {}
	onSpace() {}
	onEscape() {}
	onKey(s: string, key: any) {}
	onEnter() {}

	protected getTitleStyle() {
		return this.renderActive() ? this.titleStyleActive : this.titleStyleInActive;
	}

	protected getTextStyle() {
		return this.renderActive() ? this.textStyleActive : this.textStyleInActive;
	}

	protected getHighStyle() {
		return this.renderActive() ? this.highStyleActive : this.highStyleInActive;
	}

	protected renderBox(w: number, title: string) {
		const out = this.out;
		const pad = this.pad;

		const titleStyle = this.getTitleStyle();
		const textStyle = this.getTextStyle();

		out.write(this.padLineFull(w, pad, titleStyle, title, titleStyle)); out.write("\n");
		out.write(this.padLineFull(w, pad, textStyle, "", textStyle)); out.write("\n");
		this.renderContent(out, w, pad);
		out.write(this.padLineFull(w, pad, textStyle, "", textStyle));
	}

	erase() {
		// Cursor is on last line
		let nLinesToErase = 3 + this.contentH; // 3 = Title + Top + Bottom
		let nLinesToMoveUp = nLinesToErase - 1; // Move up to title line

		if (this.didNewlines) nLinesToMoveUp += 2; // Cursor is on second line after last line

		this.out.write(cursor.prevLine(nLinesToMoveUp) + cursor.to(0));
		// Cursor is on title line

		const blank = " ".repeat(this.contentW + this.pad * 2);
		for (let i = 0; i < nLinesToErase; ++i) {
			this.out.write(blank);
			if (i < nLinesToErase - 1) this.out.write("\n");
		}
		// Cursor is on last line
		this.out.write(cursor.prevLine(nLinesToErase - 1) + cursor.to(0));
		// Cursor is on title line
	}

	protected unstyled(s: string) {
		s = s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
		return s;
	}

	protected padLineFull(w: number, pad: number, bgStyle: ChalkInstance, txt: string, txtStyle: ChalkInstance) {
		const txtLen = this.unstyled(txt).length;
		const spad = " ".repeat(pad);
		const stxt = `${txt}${" ".repeat(Math.max(0, w - txtLen))}`;
		return `${bgStyle(spad)}${txtStyle(stxt)}${bgStyle(spad)}`;
	}

	protected padLineText(w: number, pad: number, bgStyle: ChalkInstance, txt: string, txtStyle: ChalkInstance) {
		const txtLen = this.unstyled(txt).length;
		const lpad = " ".repeat(pad);
		const rpad = " ".repeat(Math.max(0, w - txtLen + pad));
		const stxt = txt;
		return `${bgStyle(lpad)}${txtStyle(stxt)}${bgStyle(rpad)}`;
	}

	protected centerLineFull(w: number, bgStyle: ChalkInstance, txt: string, txtStyle: ChalkInstance) {
		const txtLen = this.unstyled(txt).length;
		const padL = Math.trunc((w - txtLen) / 2);
		const padR = w - txtLen - padL;
		const spadl = " ".repeat(Math.max(0, padL + this.pad));
		const spadr = " ".repeat(Math.max(0, padR + this.pad));
		return `${bgStyle(spadl)}${txtStyle(txt)}${bgStyle(spadr)}`;
	}
}

export class InputWidget extends TermWidget {
	private minLen;
	private maxLen;
	private placeholder;

	private txt = "";
	private pos = 0;

	constructor(term: Term, options: WidgetOptions & { minLen?: number, maxLen: number, placeholder: string }) {
		super(term, options);
		this.minLen = options.minLen ?? 0;
		this.maxLen = options.maxLen;
		this.placeholder = options.placeholder;

		this.contentW = this.unstyled(options.title).length;
		this.contentW = Math.max(this.contentW, this.maxLen);
		this.contentH = 1;
	}

	getText() {
		return this.txt;
	}

	override onLeft(): void {
		if (this.pos > 0) {
			--this.pos;
			this.out.write(cursor.backward(1));
		}
	}

	override onRight(): void {
		if (this.pos < this.txt.length) {
			++this.pos;
			this.out.write(cursor.forward(1));
		}
	}

	override onHome(): void {
		this.pos = 0;
	}

	override onEnd(): void {
		this.pos = this.txt.length;
	}

	override onDelete(): void {
		if (this.pos >= this.txt.length) return;
		this.txt = this.txt.substring(0, this.pos) + this.txt.substring(this.pos + 1);
	}

	override onBackspace(): void {
		if (this.pos <= 0) return;
		this.txt = this.txt.substring(0, this.pos - 1) + this.txt.substring(this.pos);
		--this.pos;
	}

	override onSpace(): void {
		if (this.txt.length >= this.maxLen) return;
		this.onKey(" ", undefined);
	}

	override onKey(s: string, key: any): void {
		if (this.txt.length >= this.maxLen) return;
		this.txt = this.txt.substring(0, this.pos) + s + this.txt.substring(this.pos);
		++this.pos;
	}

	override onEnter(): void {
		if (this.txt.length < this.minLen) return;
		this.active = false;
		this.render();
		this.done = true;
		this.resolve("done");
	}

	override render() {
		if (this.done) return;

		this.out.write(cursor.hide);

		if (this.isFirstRender) {
			this.isFirstRender = false;
		} else {
			const nLines = 3;
			this.out.write(cursor.prevLine(nLines - 1) + cursor.to(0));
		}

		this.renderBox(this.contentW, this.title);
		this.out.write(cursor.up(1) + cursor.to(this.pad + this.pos));

		if (this.active) {
			this.out.write(cursor.show);
		} else {
			this.out.write(cursor.hide);
			if (this.autoNewlines) {
				this.out.write("\n\n\n");
				this.didNewlines = true;
			} else {
				// Just write one newline to move from the input field down to the last line.
				// Do *not* set this.didNewlines
				this.out.write("\n");
			}
		}
	}

	protected override renderContent(out: WriteStream, w: number, pad: number) {
		const txt = this.renderActive()
			? this.txt || this.placeholder
			: this.txt;

		const txtStyle = this.renderActive()
			? this.txt ? chalk.bgBlack.whiteBright : chalk.bgBlack.gray
			: this.getHighStyle();

		out.write(this.padLineFull(w, pad, this.getTextStyle(), txt, txtStyle)); out.write("\n");
	}
}

export class SelectWidget extends TermWidget {
	private items: string[];
	private multi: boolean;
	private dir;
	private sels;
	private pos;
	private vgap = 0;

	constructor(term: Term, options: WidgetOptions & { multi: boolean, dir?: "ver" | "hor", items: string[] }) {
		super(term, options);
		this.items = options.items;
		this.multi = options.multi;
		this.dir = options.dir ?? "ver";
		this.sels = this.multi ? [] : [0];
		this.pos = 0;
		this.contentW = this.unstyled(options.title).length;
		if (this.dir === "ver") {
			for (const item of this.items) {
				const txtLen = this.unstyled(item).length;
				this.contentW = Math.max(this.contentW, txtLen + (this.multi ? 2 : 0));
			}
			this.contentH = this.items.length;
		} else {
			let sum = 0;
			for (const item of this.items) {
				const txtLen = this.unstyled(item).length;
				sum += txtLen + (this.multi ? 4 : 2);
			}
			this.vgap = sum < this.contentW ? 2 : 1;
			sum += Math.max(0, (this.items.length - 1) * this.vgap);
			this.contentW = Math.max(this.contentW, sum);
			this.contentH = 1;
		}
	}

	getSelectedIndex() {
		this.sels.sort((a, b) => a - b);
		return this.sels.length === 0 ? -1 : this.sels[0];
	}

	getSelectedItem() {
		const ind = this.getSelectedIndex();
		return ind === -1 ? undefined : this.items[ind];
	}

	getSelectedIndexes() {
		this.sels.sort((a, b) => a - b);
		return [...this.sels];
	}

	getSelectedItems() {
		const inds = this.getSelectedIndexes();
		return inds.map(ind => this.items[ind]);
	}

	override onLeft(): void {
		this.onUp();
	}

	override onRight(): void {
		this.onDown();
	}

	override onUp(): void {
		this.pos = (--this.pos + this.items.length) % this.items.length;
		if (!this.multi) this.sels = [this.pos];
		this.render();
	}

	override onDown(): void {
		this.pos = ++this.pos % this.items.length;
		if (!this.multi) this.sels = [this.pos];
		this.render();
	}

	override onSpace(): void {
		if (!this.multi) return;
		const ind = this.sels.indexOf(this.pos);
		if (ind !== -1) {
			this.sels.splice(ind, 1);
		} else {
			this.sels.push(this.pos);
		}
		this.render();
	}

	override onEnter(): void {
		this.active = false;
		this.render();
		this.done = true;
		this.resolve("done");
	}

	override render() {
		if (this.done) return;
		this.out.write(cursor.hide);

		if (this.isFirstRender) {
			this.isFirstRender = false;
		} else {
			const nLines = this.dir === "ver"
				? this.items.length + 2
				: 3;
			this.out.write(cursor.prevLine(nLines) + cursor.to(0));
		}

		this.renderBox(this.contentW, this.title);

		if (this.active) {
		} else {
			if (this.autoNewlines) {
				this.out.write("\n\n");
				this.didNewlines = true;
			}
		}
	}

	protected override renderContent(out: WriteStream, w: number, pad: number) {
		const txtStyle = this.getTextStyle();
		const highStyle = this.getHighStyle();

		const unselectedChar = "○";
		// const selectedChar = "●";
		// const unselectedChar = "□";
		// const selectedChar = "■";
		const selectedChar = "✓";

		if (this.dir === "ver") {
			for (let i = 0; i < this.items.length; ++i) {
				const item = this.items[i];

				const sel = this.sels.includes(i);
				const high = this.renderActive() && (this.multi ? this.pos === i : this.sels.includes(i));
				const style = this.renderActive() ? (high ? highStyle : txtStyle) : (sel ? highStyle : txtStyle);

				const txt = this.multi
					? ` ${sel ? selectedChar : unselectedChar} ${item} `
					: ` ${item} `;


				out.write(this.padLineText(w + 2, pad - 1, txtStyle, txt, style)); out.write("\n");
			}
		} else {
			let s = "";
			const sgap = txtStyle(" ".repeat(this.vgap));
			for (let i = 0; i < this.items.length; ++i) {
				const item = this.items[i];

				const sel = this.sels.includes(i);
				const high = this.renderActive() && (this.multi ? this.pos === i : this.sels.includes(i));
				const style = this.renderActive() ? (high ? highStyle : txtStyle) : (sel ? highStyle : txtStyle);

				const txt = this.multi
					? ` ${sel ? selectedChar : unselectedChar} ${item} `
					: ` ${item} `;

				s += this.padLineText(txt.length, 0, txtStyle, txt, style);
				if (i < this.items.length - 1) s += sgap;
			}
			s = this.centerLineFull(w, txtStyle, s, txtStyle);
			out.write(s); out.write("\n");
		}
	}
}

export type Task = {
	text: string;
	state: "pending" | "running" | "success" | "failed";
}

export class TaskWidget extends TermWidget {
	private tasks: Task[];
	private interval;
	private spinnerPhase = 0;
	private renderedTextLines: string[] = [];

	constructor(term: Term, options: WidgetOptions & { tasks: Task[] }) {
		super(term, options);
		this.tasks = options.tasks;
		this.contentW = this.unstyled(options.title).length;
		for (const task of this.tasks) {
			const txtLen = this.unstyled(task.text).length;
			this.contentW = Math.max(this.contentW, txtLen + 2);
		}
		this.contentH = this.tasks.length;
	}

	getRenderedTextLines() {
		return this.renderedTextLines;
	}

	override start(resolve: (value: WidgetResult | PromiseLike<WidgetResult>) => void): void {
		super.start(resolve);
		this.interval = setInterval(() => {
			if (this.active && !this.done) {
				this.render();
				this.checkEnd();
			} else {
				clearInterval(this.interval);
			}
		}, 100);
	}

	override cancel(): void {
		clearInterval(this.interval);
		super.cancel();
	}

	private checkEnd() {
		let allDone = true;
		let oneFailed = false;
		for (let i = 0; i < this.tasks.length; ++i) {
			const task = this.tasks[i];
			if (task.state !== "success") allDone = false;
			if (task.state === "failed") oneFailed = true;
		}

		if (allDone || oneFailed) {
			this.end(allDone ? "done" : "error");
		}
	}

	private end(state: "done" | "error") {
		clearInterval(this.interval);
		this.active = false;
		this.render();
		this.done = true;
		this.resolve(state);
	}

	override render() {
		if (this.done) return;
		this.out.write(cursor.hide);

		if (this.isFirstRender) {
			this.isFirstRender = false;
		} else {
			const nLines = this.tasks.length + 2
			this.out.write(cursor.prevLine(nLines) + cursor.to(0));
		}

		this.renderBox(this.contentW, this.title);

		if (this.active) {
		} else {
			if (this.autoNewlines) {
				this.out.write("\n\n");
				this.didNewlines = true;
			}
		}
	}

	protected override renderContent(out: WriteStream, w: number, pad: number) {
		const txtStyle = this.getTextStyle();

		const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
		const spinner = spinnerChars[this.spinnerPhase];
		this.spinnerPhase = ++this.spinnerPhase % spinnerChars.length;

		const pendingChar = "▷";
		const successChar = (this.renderActive() ? chalk.green : chalk.greenBright)("✓");
		const failedChar = (this.renderActive() ? chalk.red : chalk.red)("✗");

		this.renderedTextLines = [];
		for (let i = 0; i < this.tasks.length; ++i) {
			const task = this.tasks[i];

			const style = txtStyle;
			const state = task.state === "pending" ? pendingChar : task.state === "running" ? spinner : task.state === "success" ? successChar : failedChar;
			const txt = `${state} ${task.text}`;
			this.renderedTextLines.push(txt);

			out.write(this.padLineText(w, pad, txtStyle, txt, style)); out.write("\n");
		}
	}
}

export class MessageWidget extends TermWidget {
	private items: string[];

	constructor(term: Term, options: WidgetOptions & { items: string[] }) {
		super(term, options);
		this.items = options.items;
		this.contentW = this.unstyled(options.title).length;
		for (const item of this.items) {
			const txtLen = this.unstyled(item).length;
			this.contentW = Math.max(this.contentW, txtLen);
		}
		this.contentH = this.items.length;
	}

	private end() {
		this.active = false;
		this.render();
		this.done = true;
		this.resolve("done");
	}

	override render() {
		if (this.done) return;
		this.out.write(cursor.hide);

		if (this.isFirstRender) {
			this.isFirstRender = false;
		} else {
			const nLines = this.items.length + 2
			this.out.write(cursor.prevLine(nLines) + cursor.to(0));
		}

		this.renderBox(this.contentW, this.title);

		if (this.active) {
			this.end();
		} else {
			if (this.autoNewlines) {
				this.out.write("\n\n");
				this.didNewlines = true;
			}
		}
	}

	protected override renderContent(out: WriteStream, w: number, pad: number) {
		const txtStyle = this.getTextStyle();
		for (let i = 0; i < this.items.length; ++i) {
			const txt = this.items[i];
			out.write(this.padLineText(w, pad, txtStyle, txt, txtStyle)); out.write("\n");
		}
	}
}
