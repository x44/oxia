export type GlobalProps = {
    readonly [key: string]: string
}

export type BuildProps = {
	/**
	 * Absolute path of the current route .oxia file.
	 * - /project/src/routes/index.oxia
	 * - /project/src/routes/about.oxia
	 * - /project/src/routes/other/index.oxia
	 * - /project/src/routes/other/about.oxia
	 */
	readonly oxiaFilePath: string;

	/**
	 * Absolute dir of the current route .oxia file.
	 * - /project/src/routes
	 * - /project/src/routes
	 * - /project/src/routes/other
	 * - /project/src/routes/other
	 */
	readonly oxiaFileDir: string;

	/**
	 * File name with extension of the current route .oxia file.
	 * - index.oxia
	 * - about.oxia
	 */
	readonly oxiaFileName: string;

	/**
	 * The route ****without leading slash**** of the current route.
	 * - /project/src/routes/index.oxia => ""
	 * - /project/src/routes/about.oxia => "about"
	 * - /project/src/routes/other/index.oxia => "other"
	 * - /project/src/routes/other/about.oxia => "other/about"
	 */
	readonly route: string;

	/**
	 * The route ****with leading slash**** of the current route.
	 * - /project/src/routes/index.oxia => "/"
	 * - /project/src/routes/about.oxia => "/about"
	 * - /project/src/routes/other/index.oxia => "/other"
	 * - /project/src/routes/other/about.oxia => "/other/about"
	 */
	readonly routePath: string;

	/**
	 * The last part of the route of the current route.
	 *
	 * ****For the index files in all routes this value is "index"!****
	 * - /project/src/routes/index.oxia => "index"
	 * - /project/src/routes/about.oxia => "about"
	 * - /project/src/routes/other/index.oxia => "index"
	 * - /project/src/routes/other/about.oxia => "about"
	 */
	readonly routeName: string;
}

export { };
