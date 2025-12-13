import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import type { ResolvedOptions } from "../config/types.js";
import { Log } from "../util/log.js";

type MemFile = {
	content: string;
}

export class MemFs {
	/** Key: id */
	private static instance: MemFs;

	/** Key: Absolute file path */
	private mfs = new Map<string, MemFile>();

	static getInstance() {
		return MemFs.instance!;
	}

	constructor() {
		MemFs.instance = this;
	}

	/** Loads a file from disk and stores it in the mem fs. */
	loadTextFile(path: string) {
		path = slashify(resolve(path));
		let file = this.mfs.get(path);
		if (file === undefined) {
			file = {
				content: readFileSync(path, "utf8"),
			};
			this.mfs.set(path, file);
		}
		return file.content;
	}

	/** Reads a file from the mem fs. */
	readTextFile(path: string) {
		path = slashify(resolve(path));
		return this.mfs.get(path)!.content;
	}

	/** Writes a file to the mem fs. */
	writeTextFile(path: string, content: string) {
		path = slashify(resolve(path));
		let file = this.mfs.get(path);
		if (file === undefined) {
			file = {
				content,
			};
			this.mfs.set(path, file);
		} else {
			file.content = content;
		}
	}

	exists(path: string) {
		path = slashify(resolve(path));
		return this.mfs.has(path);
	}

	clear() {
		this.mfs.clear();
	}

	removeFile(path: string) {
		path = slashify(resolve(path));
		this.mfs.delete(path);
	}

	removeFiles(paths: string[]) {
		for (let path of paths) {
			path = slashify(resolve(path));
			this.mfs.delete(path);
		}
	}

	dump() {
		const paths = [...this.mfs.keys()].sort();
		for (const path of paths) {
			Log.log(path);
		}
	}

	dumpToConsole(options: ResolvedOptions) {
		const srcRootDir = options.paths.source;
		const off = srcRootDir.length + 1;
		const paths = [...this.mfs.keys()].sort();
		for (const path of paths) {
			Log.mark(path.substring(off));
			Log.log(this.mfs.get(path));
		}
	}

	dumpToDisk(options: ResolvedOptions) {
		const srcRootDir = options.paths.source;
		const rel = relative(resolve(""), options.paths.root);
		const tmp = resolve(join("tmp", rel));
		const off = srcRootDir.length + 1;
		Log.warn("dumping memfs to", tmp);
		const paths = [...this.mfs.keys()].sort();
		for (const path of paths) {
			const dstFile = slashify(join(tmp, path.substring(off)));
			Log.debug("writing", dstFile);
			const dir = dirname(dstFile);
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(dstFile, this.mfs.get(path)!.content, "utf8");
		}
	}
}

function slashify(path: string) {
	return path.replaceAll("\\", "/");
}
