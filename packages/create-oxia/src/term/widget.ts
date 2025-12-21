import { cursor } from "sisteransi";
import { WriteStream } from "tty";
import { Term } from "./term.js";
import { appendStyledText, createStyledText, getStyledTextLength, highlightStyledText, StyledText, toStyledString } from "./text.js";
import { getTheme } from "./theme.js";

type WidgetOptions = {
	title: string;
	alwaysActive?: boolean;
	autoNewlines?: boolean
}

export type WidgetResult = "done" | "error" | "cancel";

export abstract class TermWidget {
	protected out: WriteStream;
	protected title;
	protected isFirstRender = true;
	protected alwaysActive = false;
	protected autoNewlines = true;
	protected didNewlines = false;
	protected contentW = 0;
	protected contentH = 0;
	protected active = false;
	protected done = false;
	protected resolve: (value: WidgetResult | PromiseLike<WidgetResult>) => void;

	constructor(term: Term, options: WidgetOptions) {
		this.out = term.getOut();
		this.title = options.title;
		this.alwaysActive = options.alwaysActive ?? false;
		this.autoNewlines = options.autoNewlines ?? true;
		this.contentW = options.title.length;
		const theme = getTheme();
		this.contentW += theme.metrics.titlePrefix.length + theme.metrics.titleSuffix.length;
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
	protected renderContent(out: WriteStream) {}

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

	protected renderBox() {
		const out = this.out;

		this.renderTitleLine(this.title);
 		this.renderFirstLine();
 		this.renderContent(out);
 		this.renderLastLine();
	}

	erase() {
		const theme = getTheme();

		// Cursor is on last line
		let nLinesToErase = this.getLeadingLineCount() + this.getTrailingLineCount() + this.contentH;
		let nLinesToMoveUp = nLinesToErase - 1; // Move up to title line

		if (this.didNewlines) nLinesToMoveUp += 2; // Cursor is on second line after last line

		this.out.write(cursor.prevLine(nLinesToMoveUp) + cursor.to(0));
		// Cursor is on title line

		const blank = " ".repeat(this.getTotalW());
		for (let i = 0; i < nLinesToErase; ++i) {
			this.out.write(blank);
			if (i < nLinesToErase - 1) this.out.write("\n");
		}
		// Cursor is on last line
		this.out.write(cursor.prevLine(nLinesToErase - 1) + cursor.to(0));
		// Cursor is on title line
	}

	protected getLeadingLineCount() {
		let n = 0;
		if (this.title !== "") ++n;
		++n; // top spacer line
		return n;
	}

	protected getTrailingLineCount() {
		return 1;
	}

	protected getLeadingCharCount() {
		return 1 + getTheme().metrics.pad; // left border + pad
	}

	private getTotalW() {
		const pad = getTheme().metrics.pad;
		const left = Math.max(1 + pad, getTheme().metrics.titleX);
		const right = 1 + pad;
		return this.contentW + left + right;
	}

	protected renderTitleLine(title: string) {
		const { metrics, border } = getTheme();
		const titleX = metrics.titleX;
		let styledText: StyledText = [];
		if (!metrics.borderStroked || metrics.borderInside) {
			appendStyledText(styledText, " ".repeat(titleX), "title");
			if (metrics.titlePrefix) appendStyledText(styledText, metrics.titlePrefix, "border");
			appendStyledText(styledText, title, "title");
			if (metrics.titleSuffix) appendStyledText(styledText, metrics.titleSuffix, "border");
			appendStyledText(styledText, " ".repeat(this.getTotalW() - getStyledTextLength(styledText)), "title");
		} else {
			if (titleX > 0) appendStyledText(styledText, border.charLT, "border");
			if (titleX > 1) appendStyledText(styledText, border.charH.repeat(titleX - 1), "border");
			if (metrics.titlePrefix) appendStyledText(styledText, metrics.titlePrefix, "border");
			appendStyledText(styledText, title, "title");
			if (metrics.titleSuffix) appendStyledText(styledText, metrics.titleSuffix, "border");
			appendStyledText(styledText, border.charH.repeat(this.getTotalW() - 1 - getStyledTextLength(styledText)), "border");
			appendStyledText(styledText, border.charRT, "border");
		}
		this.out.write(toStyledString(styledText, this.renderActive())); this.out.write("\n");
	}

	protected renderFirstLine() {
		const { metrics, border } = getTheme();
		let styledText: StyledText = [];
		if (!metrics.borderStroked || !metrics.borderInside) {
			appendStyledText(styledText, border.charV, "border");
			appendStyledText(styledText, " ".repeat(this.getTotalW() - 1 - getStyledTextLength(styledText)), "normal");
			appendStyledText(styledText, border.charV, "border");
		} else {
			appendStyledText(styledText, border.charLT, "border");
			appendStyledText(styledText, border.charH.repeat(this.getTotalW() - 1 - getStyledTextLength(styledText)), "border");
			appendStyledText(styledText, border.charRT, "border");
		}
		this.out.write(toStyledString(styledText, this.renderActive())); this.out.write("\n");
	}

	protected renderLastLine() {
		const { metrics, border } = getTheme();
		let styledText: StyledText = [];
		if (!metrics.borderStroked) {
			appendStyledText(styledText, " ".repeat(this.getTotalW()), "normal");
		} else {
			appendStyledText(styledText, border.charLB, "border");
			appendStyledText(styledText, border.charH.repeat(this.getTotalW() - 1 - getStyledTextLength(styledText)), "border");
			appendStyledText(styledText, border.charRB, "border");
		}
		this.out.write(toStyledString(styledText, this.renderActive())); // NO newline here!
	}

	protected genContentLine(content: StyledText, fullWidth: boolean, x = 0) {
		const { metrics, border } = getTheme();
		let styledText: StyledText = [];

		appendStyledText(styledText, border.charV, "border");
		appendStyledText(styledText, " ".repeat(Math.max(0, metrics.pad + x)), "normal");

		styledText.push(...content);

		let txtLen = getStyledTextLength(styledText);

		const totalW = this.getTotalW();

		const expandLen = fullWidth ? Math.max(0, totalW - metrics.pad - 1 - txtLen) : 0;
		if (expandLen) {
			const expandStyle = fullWidth ? content[0].style : "normal";
			appendStyledText(styledText, " ".repeat(expandLen), expandStyle);
			txtLen += expandLen;
		}

		appendStyledText(styledText, " ".repeat(Math.max(0, totalW - 1 - txtLen)), "normal");
		appendStyledText(styledText, border.charV, "border");

		return toStyledString(styledText, this.renderActive());
	}

	protected genSelectLineVer(content: StyledText) {
		const fullWidth = false;
		return this.genContentLine(content, fullWidth, -1);
	}

	protected genSelectLineHor(content: StyledText) {
		let txtLen = getStyledTextLength(content);
		const txtPad = Math.trunc((this.contentW - txtLen) / 2);
		content.unshift(...createStyledText(" ".repeat(Math.max(0, txtPad)), "normal"));
		return this.genContentLine(content, false);
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

		const theme = getTheme();

		this.out.write(cursor.hide);

		if (this.isFirstRender) {
			this.isFirstRender = false;
		} else {
			const nLines = this.getLeadingLineCount() + this.contentH;
			this.out.write(cursor.prevLine(nLines - 1) + cursor.to(0));
		}

		this.renderBox();
		this.out.write(cursor.up(1) + cursor.to(this.getLeadingCharCount() + this.pos));

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

	protected override renderContent(out: WriteStream) {
		const txt = this.renderActive()
			? this.txt || this.placeholder
			: this.txt;

		const style = this.txt ? "input" : "placeholder";
		out.write(this.genContentLine(createStyledText(txt, style), true)); out.write("\n");
	}
}

export class SelectWidget extends TermWidget {
	private items: StyledText[];
	private multi: boolean;
	private dir;
	private sels;
	private pos;
	private vgap = 0;

	constructor(term: Term, options: WidgetOptions & { multi: boolean, dir?: "ver" | "hor", items: StyledText[] }) {
		super(term, options);
		this.items = options.items;
		this.multi = options.multi;
		this.dir = options.dir ?? "ver";
		this.sels = this.multi ? [] : [0];
		this.pos = 0;

		const singleExtraLen = getTheme().metrics.useSingleSelectChars ? 2 : 0;

		if (this.dir === "ver") {
			for (const item of this.items) {
				const txtLen = getStyledTextLength(item);
				this.contentW = Math.max(this.contentW, txtLen + (this.multi ? 2 : singleExtraLen));
			}
			this.contentH = this.items.length;
		} else {
			let sum = 0;
			for (const item of this.items) {
				const txtLen = getStyledTextLength(item);
				sum += txtLen + (this.multi ? 4 : 2 + singleExtraLen);
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
			const nLines = this.getLeadingLineCount() + this.contentH;
			this.out.write(cursor.prevLine(nLines) + cursor.to(0));
		}

		this.renderBox();

		if (this.active) {
		} else {
			if (this.autoNewlines) {
				this.out.write("\n\n");
				this.didNewlines = true;
			}
		}
	}

	protected override renderContent(out: WriteStream) {
		const multiUnselectedChar = "□";
		const multiSelectedChar = "✓";
		const singleUnselectedChar = "○";
		const singleSelectedChar = "●";
		// "○"
		// "●";
		// "□";
		// "■";
		const useSingleSelectChars = getTheme().metrics.useSingleSelectChars;
		if (this.dir === "ver") {
			for (let i = 0; i < this.items.length; ++i) {
				const item = this.items[i];

				const sel = this.sels.includes(i);
				const highlight = this.renderActive() && (this.multi ? this.pos === i : sel);

				const styledText: StyledText = [];
				appendStyledText(styledText, " ", "normal", highlight);
				if (this.multi) {
					appendStyledText(styledText, (sel ? multiSelectedChar : multiUnselectedChar) + " ", "normal", highlight);
				} else
				if (useSingleSelectChars) {
					appendStyledText(styledText, (sel ? singleSelectedChar : singleUnselectedChar) + " ", "normal", highlight);
				}
				styledText.push(...highlightStyledText(item, highlight));
				appendStyledText(styledText, " ", "normal", highlight);

				out.write(this.genSelectLineVer(styledText)); out.write("\n");
			}
		} else {
			const styledText: StyledText = [];

			const sgap = " ".repeat(this.vgap);
			for (let i = 0; i < this.items.length; ++i) {
				const item = this.items[i];

				const sel = this.sels.includes(i);
				const highlight = this.renderActive() && (this.multi ? this.pos === i : sel);

				// Move half of the item's leading spaces before the (un)select char
				const itemTrimmed = createStyledText(item[0].text.trimStart(), item[0].style, highlight);
				const leadingSpaceCount = item[0].text.length - itemTrimmed[0].text.length;
				const leadingSpaceCount1 = Math.trunc(leadingSpaceCount / 2);
				const leadingSpaceCount2 = leadingSpaceCount - leadingSpaceCount1;
				const leadingSpaces1 = " ".repeat(leadingSpaceCount1);
				const leadingSpaces2 = " ".repeat(leadingSpaceCount2);

				appendStyledText(styledText, " ", "normal", highlight);
				if (this.multi) {
					appendStyledText(styledText, leadingSpaces1 + (sel ? multiSelectedChar : multiUnselectedChar) + leadingSpaces2 + " ", "normal", highlight);
				} else
				if (useSingleSelectChars) {
					appendStyledText(styledText, leadingSpaces1 + (sel ? singleSelectedChar : singleUnselectedChar) + leadingSpaces2 + " ", "normal", highlight);
				} else {
					appendStyledText(styledText, leadingSpaces1 + leadingSpaces2, "normal", highlight);
				}
				styledText.push(...itemTrimmed, ...highlightStyledText(item.slice(1), highlight));
				appendStyledText(styledText, " ", "normal", highlight);

				if (i < this.items.length - 1) {
					appendStyledText(styledText, sgap, "normal", false);
				}
			}

			out.write(this.genSelectLineHor(styledText)); out.write("\n");
		}
	}
}

export type Task = {
	text: StyledText;
	state: "pending" | "running" | "success" | "failed";
}

export class TaskWidget extends TermWidget {
	private tasks: Task[];
	private interval;
	private spinnerPhase = 0;
	private renderedTextLines: StyledText[] = [];

	constructor(term: Term, options: WidgetOptions & { tasks: Task[] }) {
		super(term, options);
		this.tasks = options.tasks;
		for (const task of this.tasks) {
			const txtLen = getStyledTextLength(task.text);
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
			const nLines = this.getLeadingLineCount() + this.contentH;
			this.out.write(cursor.prevLine(nLines) + cursor.to(0));
		}

		this.renderBox();

		if (this.active) {
		} else {
			if (this.autoNewlines) {
				this.out.write("\n\n");
				this.didNewlines = true;
			}
		}
	}

	protected override renderContent(out: WriteStream) {
		const spinnerChars = [createStyledText('⠋', "normal"), createStyledText('⠙', "normal"), createStyledText('⠹', "normal"), createStyledText('⠸', "normal"), createStyledText('⠼', "normal"), createStyledText('⠴', "normal"), createStyledText('⠦', "normal"), createStyledText('⠧', "normal"), createStyledText('⠇', "normal"), createStyledText('⠏', "normal")];
		const spinner = spinnerChars[this.spinnerPhase];
		this.spinnerPhase = ++this.spinnerPhase % spinnerChars.length;

		const pendingChar = createStyledText("▷", "normal");
		const successChar = createStyledText("✓", "success");
		const failedChar = createStyledText("✗", "error");
		const space = createStyledText(" ", "normal");

		this.renderedTextLines = [];
		for (let i = 0; i < this.tasks.length; ++i) {
			const task = this.tasks[i];

			const state = task.state === "pending" ? pendingChar : task.state === "running" ? spinner : task.state === "success" ? successChar : failedChar;
			const styledText: StyledText = [
				...state,
				...space,
				...task.text
			];

			this.renderedTextLines.push(styledText);

			out.write(this.genContentLine(styledText, false)); out.write("\n");
		}
	}
}

export class MessageWidget extends TermWidget {
	private items: StyledText[];

	constructor(term: Term, options: WidgetOptions & { items: StyledText[] }) {
		super(term, options);
		this.items = options.items;
		for (const item of this.items) {
			const txtLen = getStyledTextLength(item);
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
			const nLines = this.getLeadingLineCount() + this.contentH;
			this.out.write(cursor.prevLine(nLines) + cursor.to(0));
		}

		this.renderBox();

		if (this.active) {
			this.end();
		} else {
			if (this.autoNewlines) {
				this.out.write("\n\n");
				this.didNewlines = true;
			}
		}
	}

	protected override renderContent(out: WriteStream) {
		for (let i = 0; i < this.items.length; ++i) {
			out.write(this.genContentLine(this.items[i], false)); out.write("\n");
		}
	}
}
