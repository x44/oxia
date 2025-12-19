export type Node = {
	path: string;
	isRoute: boolean;
	/** Needs (re)parsing the file's imports */
	needsParse: boolean;
	dependees: Node[];
	dependencies: Node[];
}