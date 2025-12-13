declare function Style(props: StyleProps): void;

export type StyleProps =
| {
	/** The bundled css code gets embedded. @returns \<style>...\</style> */
    mode: "embed";
} & CommonStyleProps & EmbeddedStyleProps
| {
	/** The bundled css code gets referenced. @returns \<link rel="stylesheet" href="...">\</link> */
	mode: "ref";
}  & CommonStyleProps & ReferencedStyleProps

type CommonStyleProps = {
	/**
	 * Input .css file(s).
	 * Either
	 * - absolute or
	 * - relative to the current *route* oxia file (not the oxia file this tag is in) or
	 * - relative to the current "src" folder.
	 *
	 * File existance is checked in the order of the list above.
	 */
	src: string | string[];
}

type EmbeddedStyleProps = {
}

type ReferencedStyleProps = {
	/**
	 * The output .css file to produce from the bundled input .css file(s).
	 * This becomes the href attribute in the output <link> tag.
	 *
	 * If this starts with a '/' then the output file is placed
	 * in the dist folder (/dist/<dst>)
	 *
	 * If this does not start with a '/' then the output file is placed
	 * in the route's folder (/dist/route/<dst>)
	 *
	 * @example In /src/routes/about.oxia: dst="/styles/main.js" -> /dist/styles/main.js
	 * @example In /src/routes/about.oxia: dst="styles/main.js" -> /dist/about/styles/main.js
	 */
	dst: string;

	/**
	 * Whether the reference to the produced output file should be absolute or relative.
	 * - "abs" produces a reference from the document root (dist) to the output file
	 * - "rel" produces a reference from the route to the output file
	 *
	 * @example Referencing /dist/about/styles/main.css from /dist/about/index.html with "abs" -> "/dist/about/styles/main.css"
	 * @example Referencing /dist/about/styles/main.css from /dist/about/index.html with "rel" -> "styles/main.css"
	 *
	 * @default "rel"
	 */
	refType?: "abs" | "rel"
}
