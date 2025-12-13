#!/usr/bin/env node

import { ProjectExposeContext } from '@volar/language-server/lib/project/typescriptProjectLs.js';
import { createConnection, createServer, createTypeScriptProject, loadTsdkByPath } from '@volar/language-server/node.js';
import { create as createEmmetService } from 'volar-service-emmet';
// import { create as createHtmlService } from 'volar-service-html';
import { create as createCustomCssService } from './custom-css-service.js';
import { create as createCustomTypescriptServices } from './custom-typescript-services.js';

import createOxiaLanguagePlugin from './language-plugin.js';

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize(async (params) => {
	const tsdk = loadTsdkByPath(
		params.initializationOptions?.typescript?.tsdk,
		params.locale
	);

	const result = await server.initialize(
		params,
		createTypeScriptProject(
			tsdk.typescript,
			tsdk.diagnosticMessages,
			(ctx: ProjectExposeContext) => {
				return {
					languagePlugins: [createOxiaLanguagePlugin()]
				};
			}
		),
		[
			// createHtmlService(),
			createEmmetService(),
			createCustomCssService(),
			...createCustomTypescriptServices(tsdk.typescript)
		]
	);

	return result;
});

connection.onInitialized(() => {
	server.initialized();
});

connection.onShutdown(() => {
	server.shutdown();
});
