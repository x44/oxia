# vscode
Oxia extension for Visual Studio Code

The extension contains the language server and client.

## Debug the Extension
Start `Launch Client` in the Debug viewlet or

Windows: ```SHIFT+CTRL+ENTER```

macOS: ```SHIFT+CMD+ENTER```

After code changes either reload the running "Extension Development Host" or start `Launch Client` again.

## Build and Package the Extension vsix
```
pnpm package
```
... creates the `oxia.vsix` extension file.

## Build, Package and Install the Extension
```
pnpm local
```

## Manually install the Extension
```
code --install-extension oxia.vsix
```
