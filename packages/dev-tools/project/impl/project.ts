import chalk from "chalk";
import { spawnSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "fs";
import { dirname } from "path";
import { defineConfig } from "../../../oxia/src/config/config.ts";
import { type Config } from "../../../oxia/src/config/types.ts";
import { absPath, readTextFile, writeTextFile } from "../../../oxia/src/util/fs.ts";
import { errorExit } from "../../util/error.ts";
import { findParentDir } from "../../util/find-dir.ts";

type ProjectType = "test" | "template";

export class Project {
	private type: ProjectType;
	private name: string;
	private namePrefix: string;
	private dir: string;
	private packageJsonFile: string;
	private packageJson: any;
	private tsconfigJsonFile: string;
	private tsconfigJson: any;
	private oxiaConfigTsFile: string;
	private serverPort = 3000;

	constructor(type: ProjectType, name: string) {
		this.type = type;
		this.name = name;
		this.namePrefix = this.type === "test" ? "@test-projects/" : "@template-projects/";
		const wantedDir = type === "test" ? "test-projects" : "template-projects";
		const dir = findParentDir(wantedDir);
		if (!dir) throw new Error(`failed to find ${wantedDir}`);
		this.dir = absPath(dir, this.name);
		this.packageJsonFile = absPath(this.dir, "package.json");
		this.tsconfigJsonFile = absPath(this.dir, "tsconfig.json");
		this.oxiaConfigTsFile = absPath(this.dir, "oxia.config.ts");
	}

	checkExists() {
		if (!existsSync(this.dir)) errorExit("dir not exists", this.dir);
		if (!existsSync(this.packageJsonFile)) errorExit("file not exists", this.packageJsonFile);
	}

	checkNotExists() {
		if (existsSync(this.packageJsonFile)) errorExit("file already exists", this.packageJsonFile);
		if (existsSync(this.dir)) errorExit("dir already exists", this.dir);
	}

	checkDescription(): string {
		const description = this.getDescription();
		if (!description) errorExit("no description in", this.packageJsonFile);
		return description;
	}

	getDescription() {
		return this.readPackageJson()["description"];
	}

	setDescription(description: string, mandatory: boolean) {
		if (!description && mandatory) {
			errorExit("description is mandatory");
		}
		return this.createPackageJson()["description"] = description;
	}

	private createPackageJson() {
		if (this.packageJson) return this.packageJson;
		this.packageJson = {
			"name": `${this.namePrefix}${this.name}`,
			"version": "0.0.0",
			"author": "x44",
			"license": "MIT",
			"private": true,
			"description": "",
			"scripts": {
				"dev": "oxia dev",
				"dev-ext": "pnpm --filter oxia run watch",
				"build": "oxia build",
			},
			"dependencies": {
				"oxia": "workspace:*"
			}
		}
		return this.packageJson;
	}

	readPackageJson() {
		if (this.packageJson) return this.packageJson;
		return this.packageJson = JSON.parse(readTextFile(this.packageJsonFile));
	}

	writePackageJson() {
		this.log("writing", this.packageJsonFile);
		writeTextFile(this.packageJsonFile, JSON.stringify(this.createPackageJson(), null, "  "));
	}

	private createTsconfigJson() {
		if (this.tsconfigJson) return this.tsconfigJson;
		this.tsconfigJson = {
			"compilerOptions": {
				"types": [
					"oxia",
				],
				"jsx": "react",
				"noEmit": true,
			}
		}
		return this.tsconfigJson;
	}

	readTsconfigJson() {
		if (this.tsconfigJson) return this.tsconfigJson;
		return this.tsconfigJson = JSON.parse(readTextFile(this.tsconfigJsonFile));
	}

	writeTsconfigJson() {
		this.log("writing", this.tsconfigJsonFile);
		writeTextFile(this.tsconfigJsonFile, JSON.stringify(this.createTsconfigJson(), null, "  "));
	}

	async findFreeServerPort() {
		// This is just here to avoid VS Code removing the import, which is required for the eval below to work.
		if (!defineConfig) {
			errorExit("no definedConfig in scope");
		}
		const projectsDir = dirname(this.dir);
		const projects = readdirSync(projectsDir);
		const usedPorts: number[] = [];
		for await (const project of projects) {
			const projectDir = absPath(projectsDir, project);
			if (!statSync(projectDir).isDirectory()) continue;
			const oxiaConfigTsFile = absPath(projectDir, "oxia.config.ts");
			if (!existsSync(oxiaConfigTsFile)) continue;
			let src = readTextFile(oxiaConfigTsFile);
			src = src.replace(/import.*?;/g, "");
			src = src.replace(/export/g, "");
			src = src.replace(/default/g, "");
			const config = eval(src) as Config;
			const port = config?.server?.port || 3000;
			usedPorts.push(port);
		}
		while (usedPorts.includes(this.serverPort)) ++this.serverPort;
	}

	writeOxiaConfigTs() {
		const cfg: Config = {
			server: {
				port: this.serverPort,
				code: true,
			},
			main: {
				timings: false,
			}
		};
		const cfgStr = stringify(cfg, "\t");

		const code = [
			`import { defineConfig } from "oxia";`,
			``,
			`// This file does *not* get copied to the final template - it's not necessary to keep it clean.`,
			``,
			`export default defineConfig(${cfgStr});`,
		];
		this.log("writing", this.oxiaConfigTsFile);
		writeTextFile(this.oxiaConfigTsFile, code.join("\n"));
	}

	write() {
		this.writePackageJson();
		this.writeTsconfigJson();
		this.writeOxiaConfigTs();
	}

	copyFilesFrom(srcProject: Project) {
		srcProject.copySourceFilesTo(this);
		srcProject.copyStaticFilesTo(this);
	}

	copyFilesTo(dstProject: Project) {
		this.copySourceFilesTo(dstProject);
		this.copyStaticFilesTo(dstProject);
	}

	copySourceFilesTo(dstProject: Project) {
		const srcProject = this;
		const srcDir = absPath(srcProject.dir, "src");
		const dstDir = absPath(dstProject.dir, "src");
		this.log("copying", `${srcDir} => ${dstDir}`);
		this.copyDir(srcDir, dstDir);
	}

	copyStaticFilesTo(dstProject: Project) {
		const srcProject = this;
		const srcDir = absPath(srcProject.dir, "static");
		const dstDir = absPath(dstProject.dir, "static");
		this.log("copying", `${srcDir} => ${dstDir}`);
		this.copyDir(srcDir, dstDir);
	}

	private copyDir(src: string, dst: string) {
		if (!existsSync(src)) {
			return;
		}
		if (!existsSync(dst)) {
			mkdirSync(dst, { recursive: true });
		}
		const subs = readdirSync(src);
		for (const sub of subs) {
			const srcAbs = absPath(src, sub);
			const dstAbs = absPath(dst, sub);
			if (statSync(srcAbs).isDirectory()) {
				this.copyDir(srcAbs, dstAbs);
			} else {
				copyFileSync(srcAbs, dstAbs);
			}
		}
	}

	createDefaultFilesAndFolders() {
		this.log("creating", "default files and folders");
		mkdirSync(absPath(this.dir, "src", "components"), { recursive: true });
		mkdirSync(absPath(this.dir, "src", "layouts"), { recursive: true });
		mkdirSync(absPath(this.dir, "src", "routes"), { recursive: true });
		mkdirSync(absPath(this.dir, "static"), { recursive: true });

		const index = [
			`export default function index() {`,
			`	return <div>Hello, world!</div>`,
			`}`,
			``
		];
		writeTextFile(absPath(this.dir, "src", "routes", "index.oxia"), index.join("\n"));
	}

	/** This links the oxia package to node_modules. */
	runPnpmInstall() {
		this.log("linking", this.dir);
		const res = spawnSync("pnpm install", [], { shell: true, encoding: "utf8", cwd: this.dir });

		if (res.status !== 0) {
			errorExit(res.stderr);
		}
	}

	delete() {
		this.log("deleting", this.dir);
		rmSync(this.dir, { recursive: true });
		if (existsSync(this.dir)) {
			errorExit("failed to delete", this.dir);
		}
	}

	renameTo(newProject: Project) {
		if (this.type !== newProject.type) errorExit(`cannot rename a ${this.type}-project to a ${newProject}-project`);
		this.readPackageJson();

		renameSync(this.dir, newProject.dir);
		if (!existsSync(newProject.dir)) {
			errorExit("failed to rename", this.dir, "to", newProject.dir);
		}

		this.name = newProject.name;
		this.packageJson.name = `${this.namePrefix}${this.name}`;

		this.dir = newProject.dir;
		this.packageJsonFile = newProject.packageJsonFile;
		this.tsconfigJsonFile = newProject.tsconfigJsonFile;
		this.oxiaConfigTsFile = newProject.oxiaConfigTsFile;

		this.writePackageJson();
	}

	private log(msg: string, data: string) {
		console.log(chalk.yellow(msg), chalk.blue(data));
	}
}

/** Modified version of https://stackoverflow.com/a/11233515 */
function stringify(json: any, indentStr = "\t", indent = 1) {
	if(typeof json !== "object" || Array.isArray(json)){
		// not an object, stringify using native function
		return JSON.stringify(json);
	}
	// Implements recursive object serialization according to JSON spec but without quotes around the keys.
	const instr = indentStr.repeat(indent);
	const props: string = Object
		.keys(json)
		.map(key => `${instr}${key}: ${stringify(json[key], indentStr, indent + 1)}`)
		.join(",\n");
	const outstr = indentStr.repeat(Math.max(0, indent - 1));
	return `{\n${props}\n${outstr}}`;
}
