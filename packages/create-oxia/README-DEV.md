# create-oxia
CLI to create a oxia project.

This package gets invoked when users run
```npm create oxia@latest```

All projects from the `template-projects` package get bundled with this package and are available in the CLI.

## Scripts to run from this folder
Build the dist sub folder and publish to the local npm registry (verdaccio):
```
pnpm local
```

Run tests:
```
pnpm test
```

## Using the locally published package
See [dev-tools](../dev-tools/README-DEV.md#verdaccio)
