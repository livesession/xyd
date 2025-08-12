import { execSync, ExecSyncOptions } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path, { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

import colors from 'picocolors';

import { getCLIRoot, getHostPath, getCLIComponentsJsonPath, nodeInstallPackages } from './utils';

interface ComponentConfig {
    packages: string[];
    postInstall?: string[];
    xydModules?: string[];
}

// function resolveModule(dir, spec) {
//     try {
//         const requireFromDir = createRequire(pathToFileURL(dir));
//         const p = requireFromDir.resolve(spec);

//         return path.dirname(path.dirname(p)); // /@xyd-js/content/dist/index.js -> /@xyd-js/content
//     } catch {
//         return null;
//     }
// }

function resolveModuleV2(fromDir: string, pkgName: string) {
    const req = createRequire(import.meta.url);
    let entry;
    try {
        // Use Node’s resolver but start searching at fromDir
        entry = req.resolve(pkgName, { paths: [fromDir] });
    } catch {
        return null; // not found from this dir
    }

    // Walk up to the package.json that matches pkgName
    let dir = path.dirname(entry);
    while (true) {
        const pj = path.join(dir, 'package.json');
        if (existsSync(pj)) {
            try {
                const json = JSON.parse(readFileSync(pj, 'utf8'));
                if (json && json.name === pkgName) return dir;
            } catch { }
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

const xydContentPath = resolveModuleV2(getCLIRoot(), '@xyd-js/content');
const COMPONENTS: Record<string, ComponentConfig> = {
    diagrams: {
        packages: ['rehype-mermaid@^3.0.0', 'playwright@^1.54.2'],
        postInstall: ['npx playwright install --with-deps chromium'],
        xydModules: [
            xydContentPath || "",
        ]
    }
};

export async function componentsInstall(
    component: string,
    host?: boolean
) {
    const config = resolveComponent(component, host)
    if (!config) {
        return false
    }

    await installComponent(config, component);

    if (!host) {
        saveComponent(component)
    }

    return true
}

function saveComponent(component: string) {
    const cliComponentsJson = getCLIComponentsJsonPath();

    // Check if components.json exists and if diagrams is already enabled
    let shouldWriteJson = true;
    try {
        const existingComponents = JSON.parse(readFileSync(cliComponentsJson, 'utf8'));
        if (existingComponents.diagrams === true) {
            shouldWriteJson = false;
        }
    } catch (error) {
        // File doesn't exist or is invalid JSON, so we should write it
        shouldWriteJson = true;
    }

    const componentsConfig = { [component]: true };
    writeFileSync(cliComponentsJson, JSON.stringify(componentsConfig, null, 2));
    console.debug(colors.green(`✅ Components configuration written to ${cliComponentsJson}`));
}

export function resolveComponent(component: string, host?: boolean): ComponentConfig | false {
    if (!component) {
        console.error(colors.red('Error: Component name is required'));
        console.log(`Usage: xyd components install <component-name>`);
        console.log(`Available components: ${Object.keys(COMPONENTS).join(', ')}`);
        return false
    }

    if (!COMPONENTS[component]) {
        console.error(colors.red(`Error: Unknown component '${component}'`));
        console.log(`Available components: ${Object.keys(COMPONENTS).join(', ')}`);
        return false
    }


    const config = COMPONENTS[component];

    if (host) {
        config.xydModules = [
            path.resolve(getHostPath(), 'node_modules/@xyd-js/content'),
            getHostPath()
        ]
    }

    return config
}

export function componentDependencies(config: ComponentConfig | string, host?: boolean) {
    const deps = {}

    if (typeof config === 'string') {
        const resolvedConfig = resolveComponent(config, host)

        if (!resolvedConfig) {
            return false
        }

        config = resolvedConfig
    }

    for (const pkg of config.packages) {
        const [pkgName, version] = pkg.includes('@') && !pkg.startsWith('@') ? pkg.split('@') : [pkg, 'latest'];
        deps[pkgName] = version;
    }

    return deps
}

async function installComponent(
    config: ComponentConfig,
    componentName: string
) {
    function install(
        pathname: string
    ) {
        if (!config) {
            return
        }

        console.log("\n", colors.gray(`Installing ${componentName} component...`));

        try {
            // Install packages using the CLI root path
            if (config.packages.length > 0) {
                console.log(colors.gray(`Installing packages: ${config.packages.join(', ')}`));

                // Update package.json with new dependencies
                const packageJsonPath = join(pathname, 'package.json');
                const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
                const packageJsonOriginal = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

                // Add packages to dependencies
                for (const pkg of config.packages) {
                    const [pkgName, version] = pkg.includes('@') && !pkg.startsWith('@') ? pkg.split('@') : [pkg, 'latest'];
                    packageJson.dependencies = packageJson.dependencies || {};
                    packageJson.dependencies[pkgName] = version;
                }


                writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

                // Install packages using documan's nodeInstallPackages
                nodeInstallPackages(pathname);

                // TODO: better solution
                if (process.env.XYD_DEV_MODE) {
                    writeFileSync(packageJsonPath, JSON.stringify(packageJsonOriginal, null, 2));
                }
            }

            // Run post-install commands
            if (config.postInstall) {
                for (const cmd of config.postInstall) {
                    console.log(colors.gray(`Running: ${cmd}`));

                    const execOptions: ExecSyncOptions = {
                        cwd: pathname,
                        stdio: 'inherit',
                        encoding: 'utf8'
                    }

                    if (process.env.XYD_VERBOSE) {
                        execOptions.stdio = 'inherit'
                    }

                    execSync(cmd, execOptions);
                }
            }

            console.log(colors.green(`✅ ${componentName} component installed successfully!`));

        } catch (error) {
            console.error(colors.red(`❌ Failed to install ${componentName} component:`));
            console.error(error);
            process.exit(1);
        }
    }

    for (const module of config.xydModules || []) {
        install(module)
    }
}

