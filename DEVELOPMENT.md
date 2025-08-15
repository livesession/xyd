# Development Guide

## Prerequisites

- Node.js >= 22.12.0
- pnpm >= 9.9.0
- Git

## Getting Started

1. Clone the repository

2. Install dependencies:
   ```bash
   pnpm i
   ```

3. Build
   ```bash
   pnpm run build
   ```

4. Run local xyd
   ```
   XYD_DEV_MODE=1 pnpm run dev
   ```

## Development Scripts

### Main Development

- `pnpm run dev`: Runs the main development build using Lerna watch mode
- `pnpm run build`: Builds all packages
- `pnpm run clean`: Cleans build artifacts

## Package Management

The project uses pnpm workspaces for package management. When adding new dependencies:

- For package-specific dependencies:
  ```bash
  pnpm add <package> --filter <package-name>
  ```

- For workspace dependencies:
  ```bash
  pnpm add <package> --filter <package-name> --workspace
  ```

## Version Management

The project uses Changesets for version management. To create a new version:

1. Create a new changeset:
   ```bash
   pnpm changeset
   ```

2. Follow the prompts to select packages and version changes

3. Commit the changeset file

4. Create a new version:
   ```bash
   pnpm changeset version
   ```

## Troubleshooting

### Common Issues

1. **Build Issues**
   - Run `pnpm clean` to clear build artifacts
   - Ensure all dependencies are installed correctly
   - Check for TypeScript errors

2. **Style Development**
   - If styles aren't updating, try stopping and restarting the dev:styles server
   - Check the browser console for any errors
   - Ensure the correct packages are being watched

3. **Package Dependencies**
   - If packages aren't linking correctly, try running `pnpm install` again
   - Check for circular dependencies in package.json files

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and ensure code quality checks pass
4. Create a pull request
5. Wait for review and approval

## Additional Resources

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Lerna Documentation](https://lerna.js.org/)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Biome Documentation](https://biomejs.dev/)

## Commands
### Development
Install packages
```
pnpm i
```

Clear
```
./clear.sh
```

Clear verdaccio
```
./clear-verdaccio.sh
```

Start packages development mode
```
pnpm run dev
```

Build CLI in dev mode
```
pnpm run build
```

Run dev mode for style packages
```
pnpm run dev:styles
```

Login to local verdaccio
```
npm login --registry http://localhost:4873 (test, test)
```

Install xyd-js cli from verdaccio
```
npm_config_registry=http://localhost:4873 bun add -g xyd-js 
npm_config_registry=http://localhost:4873 npm i -g xyd-js 
npm_config_registry=http://localhost:4873 pnpm add -g xyd-js
```

Build xyd from using verdaccio packages
```
npm_config_registry=http://localhost:4873 xyd build 
```

Run xyd-js cli in dev mode
```
XYD_DEV_MODE=1 XYD_NODE_PM=pnpm xyd
```

npm cache cleaning
```
rm -rf $HOME/.npm/_cacache
```

run local xyd cli server
```
npm_config_registry=http://localhost:4873 xyd
```

### Tests
### e2e
With local npm registry
```
npm_config_registry=http://localhost:4873 pnpm run test:e2e ./__tests__/e2e/<PATH>
```


### Release process

run changeset
```
changeset
```

changeset version update
```
changeset version
```

changeset pre version
```
changeset pre enter <RELEASE>
```

changeset publish
```
pnpm changeset publish --otp=<OTP_CODE>
```

```
npm uninstall -g xyd-js
```

### changeset verdaccio publish
```bash
npm_config_registry=http://localhost:4873 pnpm changeset publish
``

deprecate package
```bash
pnpm deprecate <PACKAGE> "<MESSAGE>"
```

mark package version as latest
```bash
npm dist-tag add <PACKAGE>@<VERSION> latest
```

### Dev flags

```bash
XYD_DEV_MODE=1 - Enable dev mode
```

## Documentation Development

For developing documentation locally without building the CLI package:

1. First, build the documan package in development mode:
   ```bash
   XYD_DEV_MODE=1 pnpm run --filter "./packages/xyd-documan" build
   ```

2. Start the style development server (for HMR support):
   ```bash
   pnpm dev:styles
   ```

3. Run the development server directly:
   ```bash
   node packages/xyd-documan/dist/dev.js
   ```

> **Important**: The working directory (CWD) when running the development server must be the directory where your documentation files are located. For example, if your docs are in `docs/`, you should run the command from that directory:
> ```bash
> cd docs
> node ../packages/xyd-documan/dist/dev.js
> ```

This approach is equivalent to running `xyd dev` but allows for better integration with the development environment, especially for Hot Module Replacement (HMR) when making changes to styles or components.

### Development Flags

When developing documents, you can use the following environment flags:

- `XYD_DEV_MODE=1`: Enables development mode

Example with flags:
```bash
XYD_DEV_MODE=1 pnpm run --filter "./packages/xyd-documan" build
```

Note: This is the recommended approach during development as it:
- Avoids rebuilding the CLI package every time you make changes to the documents
- Enables proper HMR functionality for styles and components
- Provides faster development cycles