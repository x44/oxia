# test-projects
Oxia projects playground.

Use this package to experiment with Oxia features.

## Create, delete, rename a project
```bash
./create <project-name>

./delete <project-name>

./rename <old-project-name> <new-project-name>

./to-template <project-name>
```
See [dev-tools](../dev-tools/README-DEV.md#test-projects)

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
