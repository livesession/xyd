import { defineConfig } from 'tsup';
import pkg from './package.json';
import fs from 'fs';
import path from 'path';

const deps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
].filter((dep) => [
    "@xyd-js/core",
    "@xyd-js/content",
    "@xyd-js/framework",
    "@xyd-js/ui",
    "@xyd-js/themes",
    "@xyd-js/components",
    "@xyd-js/openapi",
    "@xyd-js/uniform",
    "@xyd-js/theme-gusto",
    // "@xyd-js/plugin-zero", // TODO: because plugin-zero has react-router dependency
].indexOf(dep) === -1)

// Define package versions that will be passed as environment variables during build
const packageVersions = {
    "@xyd-js/content": getMonorepoPackageVersion('@xyd-js/content'),
    "@xyd-js/components": getMonorepoPackageVersion('@xyd-js/components'),
    "@xyd-js/framework": getMonorepoPackageVersion('@xyd-js/framework'),
    "@xyd-js/theme-poetry": getMonorepoPackageVersion('@xyd-js/theme-poetry'),
    "@react-router/node": getMonorepoPackageVersion('@react-router/node'),
    "isbot": getMonorepoPackageVersion('isbot'),
};

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        dev: 'src/commands/dev.ts',
        build: 'src/commands/build.ts',
        serve: 'src/commands/serve.ts',
    },
    dts: {
        entry: {
            index: 'src/index.ts',
            dev: 'src/commands/dev.ts',
            build: 'src/commands/build.ts',
            serve: 'src/commands/serve.ts',
        },
        resolve: true, // Resolve external types
    },

    format: ["esm"],
    platform: 'node',
    shims: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    bundle: true, // Enable bundling
    external: [
        ...deps,

        // needed by @xyd-js/plugin-zero
        "react-router",
        "@react-router/dev",
        "@react-router/express",

        // "@xyd-js/react-router-dev",

        "@readme/json-schema-ref-parser",
        "@apidevtools/json-schema-ref-parser",
        //

        // neede by @xyd-js/sources

        //
        // Externalize Node.js built-in modules
        /^node:.*/,
        'fs',
        'path',
        'url',
        'os',
        'http',
        'https',
        'stream',
        'zlib',
        'util',
        'crypto',
        'tty',

        // "lightningcss",
        // "vite",
        // "vite-tsconfig-paths",
        // "react-router",
        // "@react-router/serve",
        // "@react-router/dev",
        // "@xydjs/react-router-dev",
        // "@mdx-js/rollup",
        // "@graphql-markdown"
    ], // Ensure no dependencies are marked as external
    env: {
        // Pass package versions as environment variables
        XYD_PACKAGE_VERSIONS: JSON.stringify(packageVersions),
    },
})


// Function to get package version from monorepo
function getMonorepoPackageVersion(packageName: string): string {
    try {
        console.log(`Looking for package: ${packageName}`);

        // For @xyd-js packages, look in the monorepo packages directory
        if (packageName.startsWith('@xyd-js/')) {
            // Get the packages directory path - go up one level from the current package
            const packagesDir = path.join(process.cwd(), '..');

            // Check if packages directory exists
            if (!fs.existsSync(packagesDir)) {
                console.warn(`Packages directory not found at ${packagesDir}`);
                return "latest";
            }

            // Read all directories in the packages folder
            const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            // Loop through each package directory
            for (const dir of packageDirs) {
                const packageJsonPath = path.join(packagesDir, dir, 'package.json');

                // Skip if package.json doesn't exist
                if (!fs.existsSync(packageJsonPath)) {
                    console.log(`No package.json found in ${dir}`);
                    continue;
                }

                // Read and parse package.json
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

                // Check if this is the package we're looking for
                if (packageJson.name === packageName) {
                    return packageJson.version;
                }
            }

            // If not found in packages, try node_modules
            const nodeModulesPath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');

            if (fs.existsSync(nodeModulesPath)) {
                const packageJson = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf8'));
                return packageJson.version;
            }
        }
        // For external packages, get version from current package.json
        else {
            // Check if it's in the current package.json dependencies
            if (pkg.dependencies && pkg.dependencies[packageName]) {
                return pkg.dependencies[packageName];
            }

            // Check if it's in the current package.json devDependencies
            if (pkg.devDependencies && pkg.devDependencies[packageName]) {
                return pkg.devDependencies[packageName];
            }

            // If not found in package.json, try node_modules
            const nodeModulesPath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');

            if (fs.existsSync(nodeModulesPath)) {
                const packageJson = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf8'));
                return packageJson.version;
            }
        }
        // Fallback to latest
        return "latest";
    } catch (error) {
        return "latest";
    }
}