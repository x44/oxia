# oxia
Oxia main package.

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

## Scripts used by other packages
The `watch` script runs oxia in self-watch mode, triggering a reload in the invoking project when the source code in the oxia package changes.

Used by `test-projects` and `template-projects`.
