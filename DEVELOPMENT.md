# Development Guide

## Prerequisites

- Node.js >= 20.17.0
- pnpm >= 9.0.0
- Git

## Project Structure

This is a monorepo using pnpm workspaces. The main packages are:

- `@xyd-js/components`: Core UI components library
- `@xyd-js/ui`: UI package
- `@xyd-js/gql`: GraphQL related functionality
- `@xyd-js/uniform`: Uniform integration
- `@xyd-js/atlas`: Atlas package with Storybook

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up Git hooks:
   ```bash
   pnpm prepare
   ```

## Development Scripts

### Main Development

- `pnpm dev`: Runs the main development build using Lerna watch mode
- `pnpm dev:styles`: Runs the watch mode for UI components and styles
- `pnpm build`: Builds all packages
- `pnpm clean`: Cleans build artifacts

### Package-Specific Builds

- `pnpm build:gql`: Builds the GraphQL package
- `pnpm build:uniform`: Builds the Uniform package
- `pnpm build:atlas-storybook`: Builds the Atlas Storybook

## Code Quality

The project uses several tools to maintain code quality:

- **Biome**: For code formatting and linting
- **Husky**: For Git hooks
- **lint-staged**: For running linters on staged files
- **TypeScript**: For type checking

### Pre-commit Hooks

Before each commit, the following checks are automatically run on staged files:
- Biome linting and formatting

## Style Development

For developing UI components and styles:

1. Start the style development server:
   ```bash
   pnpm dev:styles
   ```
   This will run watch mode for both `@xyd-js/components` and `@xyd-js/ui` packages.

2. Make changes to your components or styles
3. The changes will be automatically rebuilt

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

Start packages development mode
```
XYD_DEV_MODE=1 XYD_DEV_CLI_NOINSTALL=1 pnpm run dev
```

Build CLI in dev mode
```
XYD_DEV_MODE=1 pnpm run build
```
Run dev mode for style packages
```
pnpm run dev:styles
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

# changeset verdaccio publish
```
pnpm changeset publish --registry http://localhost:4873
``

deprecate package
```
pnpm deprecate <PACKAGE> "<MESSAGE>"
```

mark package version as latest
```
npm dist-tag add <PACKAGE>@<VERSION> latest
```

## Dev flags

```
XYD_DEV_MODE=1 - Enable dev mode

XYD_DEV_CLI_NOINSTALL=1 - Skip CLI packages installation after a build
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
- `XYD_DEV_CLI_NOINSTALL=1`: Skips CLI packages installation after a build

Example with flags:
```bash
XYD_DEV_MODE=1 XYD_DEV_CLI_NOINSTALL=1 pnpm run --filter "./packages/xyd-documan" build
```

Note: This is the recommended approach during development as it:
- Avoids rebuilding the CLI package every time you make changes to the documents
- Enables proper HMR functionality for styles and components
- Provides faster development cycles