import { defineConfig } from "oxia";

// This file does *not* get copied to the final template - it's not necessary to keep it clean.

export default defineConfig({
	server: {
		port: 3005,
		code: true
	},
	main: {
		timings: false
	}
});