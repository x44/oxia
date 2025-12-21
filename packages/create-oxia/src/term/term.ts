import * as readline from "readline";
import { cursor } from "sisteransi";
import { ReadStream, WriteStream } from "tty";
import { TermWidget, WidgetResult } from "./widget.js";

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
