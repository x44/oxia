# dev-tools
Development tools.

## test-projects
Create a test-project:
```bash
./packages/dev-tools/project/create-test.ts <project-name>
```
Delete a test-project:
```bash
./packages/dev-tools/project/delete-test.ts <project-name>
```
Rename a test-project:
```bash
./packages/dev-tools/project/rename-test.ts <old-project-name> <new-project-name>
```

## template-projects
Create a template-project:
```bash
./packages/dev-tools/project/create-template.ts <project-name>
```
Delete a template-project:
```bash
./packages/dev-tools/project/delete-template.ts <project-name>
```
Rename a template-project:
```bash
./packages/dev-tools/project/rename-template.ts <old-project-name> <new-project-name>
```

## test-project -> template-project
Create a template-project from a test-project:
```bash
./packages/dev-tools/project/copy-test-to-template.ts <project-name>
```

## template-project -> test-project
Create a test-project from a template-project:
```bash
./packages/dev-tools/project/copy-template-to-test.ts <project-name>
```

## astro
This tool builds and watches an astro project and serves the output website and formatted HTML code.

Run with:
```bash
./packages/dev-tools/astro/astro.ts <astro-project-dir> [-port n]
```
