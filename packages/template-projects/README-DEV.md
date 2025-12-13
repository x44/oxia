# template-projects
Oxia template projects.

Projects in this package are bundled with the create-oxia CLI.

## Important
- Each project ****must**** have a "description" in it's package.json, which is used by the create-oxia CLI
- ****Keep these projects clean!****

## Create, delete, rename a project
```bash
./create <project-name>

./delete <project-name>

./rename <old-project-name> <new-project-name>

./to-test <project-name>
```
See [dev-tools](../dev-tools/README-DEV.md#template-projects)

## Scripts in the project sub folders
Run the dev server in `normal` watch mode:
```
pnpm dev
```

Run the dev server in `extended` watch mode:
```
pnpm dev-ext
```
In `normal` watch mode, rebuilding/reloading is triggered when a project source changes.

In `extended` watch mode, rebuilding/reloading is also triggered when a source in the oxia package changes.
