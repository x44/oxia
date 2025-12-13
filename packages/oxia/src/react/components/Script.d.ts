declare function Script(props: ScriptProps): void;

export type ScriptProps =
| {
	/** The bundled js code gets embedded. @returns \<script>...\</script> */
    mode: "embed";
} & CommonScriptProps & EmbeddedScriptProps
| {
	/** The bundled js code gets referenced. @returns \<script src="...">\</script> */
	mode: "ref";
}  & CommonScriptProps & ReferencedScriptProps

type CommonScriptProps = {
	/**
	 * Input .ts file(s).
	 * Either
	 * - absolute or
	 * - relative to the current *route* oxia file (not the oxia file this tag is in) or
	 * - relative to the current "src" folder.
	 *
	 * File existance is checked in the order of the list above.
	 */
	src: string | string[];

	/**
	 * The "type" attribute of the produced <script> tag.
	 *
	 * @default ""
	 */
	type?: "" | "module";
}

type EmbeddedScriptProps = {
}

type ReferencedScriptProps = {
	/**
	 * The output .js file to produce from the bundled input .ts file(s).
	 * This becomes the src attribute in the output <script> tag.
	 *
	 * If this starts with a '/' then the output file is placed
	 * in the dist folder (/dist/<dst>)
	 *
	 * If this does not start with a '/' then the output file is placed
	 * in the route's folder (/dist/route/<dst>)
	 *
	 * @example In /src/routes/about.oxia: dst="/scripts/main.js" -> /dist/scripts/main.js
	 * @example In /src/routes/about.oxia: dst="scripts/main.js" -> /dist/about/scripts/main.js
	 */
	dst: string;

	/**
	 * Whether the reference to the produced output file should be absolute or relative.
	 * - "abs" produces a reference from the document root (dist) to the output file
	 * - "rel" produces a reference from the route to the output file
	 *
	 * @example Referencing /dist/about/scripts/main.js from /dist/about/index.html with "abs" -> "/dist/about/scripts/main.js"
	 * @example Referencing /dist/about/scripts/main.js from /dist/about/index.html with "rel" -> "scripts/main.js"
	 *
	 * @default "rel"
	 */
	refType?: "abs" | "rel"
}
