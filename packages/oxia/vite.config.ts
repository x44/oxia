import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		root: "test",

		globals: true,
		environment: 'jsdom',

		setupFiles: ["setup-loader.ts"],
		globalSetup: "setup.ts",

		hideSkippedTests: true,

		server: {
			deps: {
				// External means Vite bypasses these and Node handles them.
				// We need this to make vitest use our module loader to handle .oxia files!
				external: [/\.oxia$/]
			}
		}
	},
});