import { Timings } from "../../util/timings.js";
import { parseImportsFromFile } from "./dependency-parser.js";
import type { Node } from "./types.js";

export class DependencyRegistry {
	/** Key: absolute file path */
	static map = new Map<string, Node>();

	static invalidRoutes = new Set<string>();

	static addRoute(path: string) {
		this.getOrAdd(path, true);
	}

	private static getOrAdd(path: string, isRoute: boolean) {
		let node = this.map.get(path);
		if (!node) {
			this.map.set(path, node = {
				path,
				isRoute,
				needsParse: true,
				dependees: [],
				dependencies: [],
			});
			if (isRoute) {
				this.invalidRoutes.add(path);
			}
		}
		return node;
	}

	static routeNeedsValidation(path: string) {
		return this.invalidRoutes.has(path);
	}

	static validateRoute(path: string) {
		Timings.begin("dependencies");

		const node = this.map.get(path)!;

		this.validateDependencies(node);

		this.invalidRoutes.delete(path);

		Timings.end();
	}

	private static validateDependencies(node: Node) {
		if (node.needsParse) {
			this.parseDependencies(node);
			node.needsParse = false;
		}

		for (const dependency of node.dependencies) {
			this.validateDependencies(dependency);
		}
	}

	private static parseDependencies(node: Node) {
		const importPaths = parseImportsFromFile(node.path);

		// Check if the current node's dependencies are still active
		for (const dependency of node.dependencies) {
			for (let i = dependency.dependees.length - 1; i >= 0; --i) {
				// Remove the node as dependee from this dependencies which are no dependencies of the node anymore.
				const dependee = dependency.dependees[i];
				if (dependee === node) {
					// The node is a dependee of dependency
					// Check if the dependency is still a dependency of node
					if (!importPaths.includes(dependency.path)) {
						// The node does not depend on this dependency anymore,
						// remove the node from the dependency's dependees
						dependency.dependees.splice(i, 1);
					}
				}
			}
		}

		node.dependencies = [];
		for (const importPath of importPaths) {
			const dependency = this.getOrAdd(importPath, false);
			if (!dependency.dependees.includes(node)) {
				dependency.dependees.push(node);
			}
			node.dependencies.push(dependency);
		}
	}

	static removeFiles(paths: string[]) {
		for (const path of paths) {
			this.removeFile(path);
		}
	}

	static removeFile(path: string) {
		const node = this.map.get(path);
		if (!node) return;

		if (node.isRoute) {
			this.invalidRoutes.delete(path);
		}

		this.map.delete(path);

		for (const dependee of node.dependees) {
			const ind = dependee.dependencies.indexOf(node);
			if (ind !== -1) {
				dependee.dependencies.splice(ind, 1);
			}
		}
	}

	static invalidateAllFiles() {
		for (const node of this.map.values()) {
			this.invalidateFile(node.path);
		}
	}

	static invalidateFiles(paths: string[]) {
		for (const path of paths) {
			this.invalidateFile(path);
		}
	}

	static invalidateFile(path: string) {
		const node = this.map.get(path);
		if (!node) return undefined;
		if (node.needsParse) return;
		node.needsParse = true;
		this.invalidateRoutes(node);
	}

	private static invalidateRoutes(node: Node) {
		if (node.isRoute) {
			this.invalidRoutes.add(node.path);
			return;
		}
		for (const dependee of node.dependees) {
			this.invalidateRoutes(dependee);
		}
	}

	static getAllRouteDependencyPathsForGlobalStyles(path: string) {
		const node = this.map.get(path)!;
		const visitedNodes = new Set<Node>();
		const dependenciesSet = new Set<string>();
		const dependencies: string[] = [];

		// Add route, too
		dependenciesSet.add(path);
		dependencies.push(path);

		this.collectDependencyPathsForGlobalStyles(node, visitedNodes, dependenciesSet, dependencies);
		return dependencies;
	}

	private static collectDependencyPathsForGlobalStyles(node: Node, visitedNodes: Set<Node>, dependenciesSet: Set<string>, dependencies: string[]) {
		if (visitedNodes.has(node)) return;
		visitedNodes.add(node);
		for (const dependency of node.dependencies) {
			if (!dependency.path.endsWith(".oxia")) continue;
			if (!dependenciesSet.has(dependency.path)) {
				dependenciesSet.add(dependency.path);
				dependencies.push(dependency.path);
			}
		}
		// return in breadth-first order
		for (const dependency of node.dependencies) {
			this.collectDependencyPathsForGlobalStyles(dependency, visitedNodes, dependenciesSet, dependencies);
		}
	}
}
