# Oxia Monorepo

## Install

### bun
Windows
```
powershell -c "irm bun.sh/install.ps1 | iex"
```
Linux & macOS
```
curl -fsSL https://bun.sh/install | bash
```

### pnpm
Windows
```
npm install -g pnpm@latest-10
```
Linux & macOS
```
curl -fsSL https://get.pnpm.io/install.sh | sh -
```
### tsgo
```
npm i -g @typescript/native-preview
```
### vsce
```
npm install -g @vscode/vsce
```
### verdaccio
```
npm install -g verdaccio
```

## Install Dependencies
```
pnpm install
```

## Packages

[oxia](./packages/oxia/README-DEV.md)

[create-oxia](./packages/create-oxia/README-DEV.md)

[dev-tools](./packages/dev-tools/README-DEV.md)

[test-projects](./packages/test-projects/README-DEV.md)

[template-projects](./packages/template-projects/README-DEV.md)

[language-server](./packages/language-tools/language-server/README-DEV.md)

[vscode extension](./packages/language-tools/vscode/README-DEV.md)


## Verdaccio

To publish to the local Verdaccio registry without contacting the public npm registry, the following entry must be added as the first entry to the `packages:` section in the Verdaccio config file.

config.yaml
```yaml
packages:
  '*oxia*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
```

## Scripts

### oxia
```
pnpm build:oxia
pnpm local:oxia
pnpm test:oxia
```

### create-oxia
```
pnpm build:create-oxia
pnpm local:create-oxia
pnpm test:create-oxia
```

### vscode extension
```
pnpm build:vscode
pnpm watch:vscode
pnpm package:vscode
pnpm local:vscode
pnpm test:vscode
```
