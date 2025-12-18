
type Node = {
	parents: Set<Node>;
	timestamp: number;
	invalidated: boolean;
	requested: boolean;
}

export class DependencyGraph {
	/** Key: path */
	private nodes = new Map<string, Node>();

	start() {
	}

	purge() {
		this.nodes.forEach((node, path) => {
			if (node.invalidated) {
				if (!node.requested) {
					// Node was invalidated but not used -> disconnect
					node.parents.clear();
					// Log.writeln(chalk.magenta("disconnect", path));
				}
				node.invalidated = false;
			}
			node.requested = false;
		});
	}

	add(parentPath: string | undefined, path: string, timestamp: number) {
		let parentNode: Node | undefined = undefined;

		if (parentPath) {
			parentNode = this.nodes.get(parentPath);
			if (!parentNode) {
				this.nodes.set(parentPath, parentNode = {
					parents: new Set<Node>(),
					timestamp,
					invalidated: false,
					requested: false,
				});
			}
		}

		let node = this.nodes.get(path);
		if (!node) {
			this.nodes.set(path, node = {
				parents: new Set<Node>(),
				timestamp,
				invalidated: false,
				requested: false,
			});
		}

		if (parentNode) {
			node.parents.add(parentNode);
			this.dispatchTimestamp(node);
		}
	}

	invalidateAll(timestamp: number) {
		this.nodes.forEach(node => {
			node.timestamp = timestamp;
			node.invalidated = true;
		});
	}

	invalidate(paths: string[], timestamp: number) {
		for (const path of paths) {
			const node = this.nodes.get(path);
			if (!node) continue;

			if (node.timestamp < timestamp) {
				node.timestamp = timestamp;
				this.dispatchTimestamp(node);
			}

			if (!node.invalidated) {
				node.invalidated = true;
				this.dispatchInvalidated(node);
			}
		}
	}

	isInvalid(path: string) {
		const node = this.nodes.get(path);
		// If the node does not exist (yet) return invalid.
		// This avoids that the caller has to check if a module exists
		// in the first build-run.
		if (!node) return true;
		return node.invalidated;
	}

	getTimestamp(path: string) {
		const node = this.nodes.get(path)!;
		node.requested = true;
		return node.timestamp;
	}

	private dispatchTimestamp(node: Node) {
		node.parents.forEach(parent => {
			if (parent.timestamp < node.timestamp) {
				parent.timestamp = node.timestamp;
				this.dispatchTimestamp(parent);
			}
		});
	}

	private dispatchInvalidated(node: Node) {
		node.parents.forEach(parent => {
			if (!parent.invalidated) {
				parent.invalidated = true;
				this.dispatchInvalidated(parent);
			}
		});
	}
}