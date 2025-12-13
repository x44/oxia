import * as readline from "readline";

export async function confirmYes(question = "Enter 'yes' to confirm: ") {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	let promiseResolve: (value: boolean | PromiseLike<boolean>) => void;
	const promise = new Promise<boolean>(resolve => {
		promiseResolve = resolve;
	});

	rl.question(question, (answer) => {
		promiseResolve(answer === "yes");
		rl.close();
	});

	return await promise;
}

export async function input(prompt: string) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	let promiseResolve: (value: string | PromiseLike<string>) => void;
	const promise = new Promise<string>(resolve => {
		promiseResolve = resolve;
	});

	rl.question(prompt, (answer) => {
		promiseResolve(answer);
		rl.close();
	});

	return await promise;
}
