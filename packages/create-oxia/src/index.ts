import chalk from "chalk";
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, realpathSync, statSync } from "fs";
import { platform } from "os";
import { basename, dirname } from "path";
import { argv } from "process";
import { InputWidget, MessageWidget, SelectWidget, Task, TaskWidget, Term, WidgetResult } from "./term/term.js";
import { hasHelpArg } from "./util/args.js";
import { absPath, writeTextFile } from "./util/fs.js";
import { readTemplateMeta, TemplateMeta } from "./util/meta.js";

type Settings = {
	isProjectInCwd: boolean;
	projectName: string;
	projectDir: string;
	templateMeta: TemplateMeta | undefined;
	templateDir: string;
	templatesDir: string;
	packageManager: string;
	installDependencies: boolean;
	oxiaVersion: string;
}

let term: Term;

let templateMetas: TemplateMeta[] = [];

const processes: ChildProcessWithoutNullStreams[] = [];

function printHelpAndExit() {
	const packageManager = getPackageManager();
	const version = packageManager === "npm" ? "@latest" : "";
	console.log(chalk.yellow(`${packageManager} create oxia${version} <project name> [template]`));

	console.log("\nTEMPLATES\n");
	console.log(getTemplateIds().join(", "));
	console.log();

	process.exit(0);
}

function errorExit(msg: string) {
	if (term) term.close();
	console.error(chalk.red(msg));
	process.exit(0);
}

function getTemplatesDir() {
	return absPath(dirname(realpathSync(argv[1])), "dist", "templates");
}

function getTemplateMetas() {
	if (templateMetas.length) return templateMetas;

	const templatesDir = getTemplatesDir();
	const templateDirs = readdirSync(templatesDir);
	templateMetas = [
		{
			id: "empty",
			name: "Empty",
			description: "Creates an empty project",
		},
		...templateDirs.map(templateDir => readTemplateMeta(absPath(templatesDir, templateDir)))
	];
	return templateMetas;
}

function getTemplateIds() {
	return getTemplateMetas().map(templateMeta => templateMeta.id);
}

function getTemplateMeta(id: string) {
	if (!id) return undefined;
	id = id.toLowerCase();
	return getTemplateMetas().find(templateMeta => templateMeta.id === id);
}

function getPackageManager() {
	const a = process.env.npm_config_user_agent || "";
	if (a.includes("pnpm")) return "pnpm";
	if (a.includes("yarn")) return "yarn";
	return "npm";
}

function getPackageVersion(packageName: string) {
	try {
		const proc = spawnSync(`npm view ${packageName} version`, { shell: true });
		if (proc.error) {
			errorExit(`${proc.error}`);
		}
		return proc.stdout.toString("utf8").trim();
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

function createSettings() {
	const settings: Settings = {
		isProjectInCwd: false,
		projectName: "",
		projectDir: "",
		templateMeta: undefined,
		templateDir: "",
		templatesDir: getTemplatesDir(),
		packageManager: getPackageManager(),
		installDependencies: true,
		oxiaVersion: "",
	}
	return settings;
}

function updateSettingsProject(settings: Settings, projectName: string) {
	settings.projectName = projectName;
	settings.isProjectInCwd = settings.projectName === ".";
	if (settings.isProjectInCwd) {
		settings.projectDir = absPath("");
		settings.projectName = basename(settings.projectDir);
	} else {
		settings.projectDir = settings.projectName ? absPath(settings.projectName) : "";
	}

	if (!settings.projectDir) return `Missing project name!`;
	if (!settings.isProjectInCwd) {
		if (existsSync(settings.projectDir)) return `Project folder already exists!`;
	} else {
		const subs = readdirSync(settings.projectDir);
		if (subs.length) return `Project folder is not empty!`;
	}
	return undefined;
}

function updateSettingsTemplate(settings: Settings, templateId: string) {
	const templateMeta = getTemplateMeta(templateId);

	settings.templateMeta = templateMeta;
	settings.templateDir = settings.templateMeta ? absPath(settings.templatesDir, templateId) : "";

	if (!templateId) return `Missing template name!`;
	if (!existsSync(settings.templateDir) && templateId !== "empty") return `Invalid template name '${templateId}'!`;
	return undefined;
}

type Status = {
	projectName?: string;
	templateName?: string;
	options?: string[];
}

const status: Status = {};
let statusWidget: MessageWidget | undefined;

function updateStatusProject(projectName: string | undefined) {
	status.projectName = projectName;
}

function updateStatusTemplate(templateId: string | undefined) {
	if (!templateId || templateId.startsWith("ERROR:")) {
		status.templateName = templateId;
	} else {
		const templateMeta = getTemplateMeta(templateId);
		status.templateName = templateMeta ? templateMeta.name : undefined;
	}
}

function updateStatusOptions(optionToAdd: string) {
	if (!status.options) status.options = [];
	status.options.push(optionToAdd);
}

function updateStatusWidget() {
	if (statusWidget) {
		statusWidget.erase();
	}
	const statusItems = [];

	addStatusItem(statusItems, "Project  ", status.projectName);
	addStatusItem(statusItems, "Template ", status.templateName);

	if (status.options && status.options.length) {
		addStatusItem(statusItems, "", "");
		for (const option of status.options) {
			addStatusItem(statusItems, "✓ ", option);
		}
	}

	if (statusItems.length) {
		statusWidget = new MessageWidget(term, { title: "Settings", items: statusItems });
		term.setWidget(statusWidget);
	}
}

function removeStatusWidget() {
	if (statusWidget) {
		statusWidget.erase();
	}
}

function addStatusItem(statusItems: string[], label: string, value: string | undefined) {
	if (value === undefined) return;
	let s = chalk.white(label);
	if (value.startsWith("ERROR:")) {
		s += chalk.red(value.substring(6));
	} else {
		s += chalk.whiteBright(value);
	}
	statusItems.push(s);
}

async function inputSettings(settings: Settings) {

	let projectName = argv[2] || "";
	while (true) {
		if (projectName) {
			const error = updateSettingsProject(settings, projectName);

			if (error) {
				updateStatusProject("ERROR:" + error);
			} else {
				updateStatusProject(projectName);
				break;
			}
		}

		updateStatusWidget();

		const w = new InputWidget(term, { title: "Project Name", autoNewlines: false, minLen: 1, maxLen: 32, placeholder: "Project name or '.'" });
		await term.setWidget(w);
		w.erase();
		projectName = w.getText();
	}

	updateStatusWidget();


	let templateId = (argv[3] || "").toLowerCase();
	while (true) {
		if (templateId) {
			const error = updateSettingsTemplate(settings, templateId);

			if (error) {
				updateStatusTemplate("ERROR:" + error);
			} else {
				updateStatusTemplate(templateId);
				break;
			}
		}

		updateStatusWidget();

		const templateMetas = getTemplateMetas();
		const maxNameLength = templateMetas.reduce((max, templateMeta) => Math.max(max, templateMeta.name.length), 0);
		const w = new SelectWidget(term, { title: "Choose Template", autoNewlines: false, multi: false, dir: "ver", items: templateMetas.map(templateMeta => templateMeta.name.padEnd(maxNameLength, " ") + chalk.gray(" " + templateMeta.description)) });
		await term.setWidget(w);
		w.erase();

		const templateMeta = templateMetas[w.getSelectedIndex()];
		templateId = templateMeta.id;
	}

	updateStatusWidget();

	{
		const w = new SelectWidget(term, { title: "Install Dependencies?", autoNewlines: false, multi: false, dir: "hor", items: ["  YES  ", "  NO  "] });
		await term.setWidget(w);
		w.erase();
		settings.installDependencies = w.getSelectedItem().trim() === "YES";

		updateStatusOptions("Install Dependencies");
		updateStatusWidget();
	}

	removeStatusWidget();
}

function createPackageJson(settings: Settings) {
	const file = absPath(settings.projectDir, "package.json");

	const content = {
		name: settings.projectName,
		version: "0.0.1",
		author: "",
		description: "",
		scripts: {
			"dev": "oxia dev",
			"build": "oxia build",
		},
		dependencies: {
    		"oxia": `^${settings.oxiaVersion}`,
  		}
	};

	writeTextFile(file, JSON.stringify(content, null, "  "));
}

function createTsConfigJson(settings: Settings) {
	const file = absPath(settings.projectDir, "tsconfig.json");

	const content = {
		compilerOptions: {
			lib: ["ESNext"],
			types: [
				"oxia",
			],
			jsx: "react",
			noEmit: true,
		}
	};

	writeTextFile(file, JSON.stringify(content, null, "  "));
}

function createOxiaConfigTs(settings: Settings) {
	const file = absPath(settings.projectDir, "oxia.config.ts");

	const content = [
		`import { defineConfig } from "oxia";`,
		``,
		`export default defineConfig({`,
		`});`,
		``,
	];

	writeTextFile(file, content.join("\n"));
}

function createExtensionsJson(settings: Settings) {
	const file = absPath(settings.projectDir, ".vscode", "extensions.json");

	const content = {
		recommendations: ["x44.oxia-vscode"],
		unwantedRecommendations: []
	};

	writeTextFile(file, JSON.stringify(content, null, "  "));
}

function initProject(settings: Settings, task: Task) {
	task.state = "running";
	createPackageJson(settings);
	createTsConfigJson(settings);
	createOxiaConfigTs(settings);
	createExtensionsJson(settings);
	task.state = "success";
}

function copyTemplate(settings: Settings, task: Task) {
	task.state = "running";
	if (settings.templateMeta.id === "empty") {
		copyEmptyTemplate(settings);
	} else {
		copyNamedTemplate(settings);
	}
	task.state = "success";
}

function copyEmptyTemplate(settings: Settings) {
	const dstSourceDir = absPath(settings.projectDir, "src");
	const dstRoutesDir = absPath(dstSourceDir, "routes");
	const dstIndexFile = absPath(dstRoutesDir, "index.oxia");

	const indexContent = [
		`export default function index() {`,
		`\treturn <div>Hello, world!</div>`,
		`}`,
		``,
	];
	writeTextFile(dstIndexFile, indexContent.join("\n"));
}

function copyNamedTemplate(settings: Settings) {
	const subs = readdirSync(settings.templateDir);
	for (const sub of subs) {
		if (sub === "meta.json") continue;
		copyDir(absPath(settings.templateDir, sub), absPath(settings.projectDir, sub));
	}
}

function copyDir(srcDir: string, dstDir: string) {
	if (!existsSync(dstDir)) {
		mkdirSync(dstDir, { recursive: true });
	}
	const subs = readdirSync(srcDir);
	for (const sub of subs) {
		const srcAbs = absPath(srcDir, sub);
		const dstAbs = absPath(dstDir, sub);
		if (statSync(srcAbs).isDirectory()) {
			copyDir(srcAbs, dstAbs);
		} else {
			copyFileSync(srcAbs, dstAbs);
		}
	}
}

function installDependencies(settings: Settings, task: Task) {
	task.state = "running";

	let cmd = `${settings.packageManager} install`;

	const proc = spawn(cmd, { shell: true, cwd: settings.projectDir });

	addProcess(proc);

	proc.on("close", (code) => {
		removeProcess(proc);
		task.state = code === 0 ? "success" : "failed";
	});
}

async function create(settings: Settings) {

	const initTask: Task = {
		text: `Init project  ${chalk.blue(settings.projectName)}`,
		state: "pending",
	};
	const copyTask: Task = {
		text: `Copy template ${chalk.blue(settings.templateMeta.name)}`,
		state: "pending",
	};
	const installDependenciesTask: Task = {
		text: `Install dependencies with ${settings.packageManager}`,
		state: "pending",
	};

	const tasks: Task[] = [
		initTask,
		copyTask,
	];
	if (settings.installDependencies) {
		tasks.push(installDependenciesTask);
	}

	const taskWidget = new TaskWidget(term, { title: "Progress", alwaysActive: true, tasks: tasks });
	const promise = term.setWidget(taskWidget);

	settings.oxiaVersion = getPackageVersion("oxia");

	initProject(settings, initTask);
	copyTemplate(settings, copyTask);
	if (settings.installDependencies) {
		installDependencies(settings, installDependenciesTask);
	}

	const result = await promise;
	taskWidget.erase();
	showInstructionsOrError(settings, result, taskWidget.getRenderedTextLines());
}

function showInstructionsOrError(settings: Settings, result: WidgetResult, renderedTaskLines: string[]) {
	if (result === "error") {
		const msgs = [
			...renderedTaskLines,
			``,
			`${chalk.red("Something didn't go so well!")}`,
		];
		const messageWidget = new MessageWidget(term, { title: "Error", alwaysActive: true, items: msgs });
		term.setWidget(messageWidget);
	} else
	if (result === "done") {
		const msgs = [
			...renderedTaskLines,
			``,
			`You can now run your project with`,
			``
		];
		if (!settings.isProjectInCwd) {
			msgs.push(chalk.blue(`cd ${settings.projectName}`));
		}
		if (!settings.installDependencies) {
			msgs.push(chalk.blue(`${settings.packageManager} install`));
		}
		const run = settings.packageManager === "npm" ? " run" : "";
		msgs.push(chalk.blue(`${settings.packageManager}${run} dev`));

		const messageWidget = new MessageWidget(term, { title: "Done", alwaysActive: true, items: msgs });
		term.setWidget(messageWidget);
	}
}

function addProcess(proc: ChildProcessWithoutNullStreams) {
	processes.push(proc);
}

function removeProcess(proc: ChildProcessWithoutNullStreams) {
	const ind = processes.indexOf(proc);
	if (ind !== -1) {
		processes.splice(ind, 1);
	}
}

function cancelProcesses() {
	for (const proc of processes) {
		killProcess(proc);
	}
	processes.length = 0;
}

function killProcess(proc: ChildProcessWithoutNullStreams) {
	if (!proc) return;

	if (platform() === "win32") {
		spawnSync(`taskkill /pid ${proc.pid} /t /f`, [], { shell: true });
	} else {
		proc.kill(-proc.pid!);
	}
	proc = undefined;
}

export async function main() {
	if (hasHelpArg()) {
		printHelpAndExit();
	}

	term = new Term();
	term.onCancel(() => {
		cancelProcesses();
		process.exit(0);
	});

	const settings = createSettings();
	await inputSettings(settings);

	await create(settings);

	term.close();
}
