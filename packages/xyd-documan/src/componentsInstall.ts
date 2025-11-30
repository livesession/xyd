import { execSync, ExecSyncOptions } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path, { dirname, join } from "node:path";
import { createRequire } from "node:module";

import colors from "picocolors";
import type { Settings } from "@xyd-js/core";
import { readSettings } from '@xyd-js/plugin-docs';

import {
  getCLIRoot,
  getHostPath,
  getCLIComponentsJsonPath,
  nodeInstallPackages,
} from "./utils";

type ComponentConfigPackage = string | ((settings: Settings) => string | false | undefined | null)

interface ComponentConfig {
  packages: ComponentConfigPackage[];
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
    const pj = path.join(dir, "package.json");
    if (existsSync(pj)) {
      try {
        const json = JSON.parse(readFileSync(pj, "utf8"));
        if (json && json.name === pkgName) return dir;
      } catch {}
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Parse package string into name and version
 * Handles both scoped (@scope/name@version) and regular (name@version) packages
 */
function parsePackageString(pkg: string): { name: string; version: string } {
  // Check if it's a scoped package (starts with @)
  if (pkg.startsWith("@")) {
    // For scoped packages: @scope/name@version
    const lastAtIndex = pkg.lastIndexOf("@");

    if (lastAtIndex > 0) {
      // Has version specified
      return {
        name: pkg.substring(0, lastAtIndex),
        version: pkg.substring(lastAtIndex + 1),
      };
    } else {
      // No version specified
      return {
        name: pkg,
        version: "latest",
      };
    }
  } else {
    // For regular packages: name@version
    const atIndex = pkg.indexOf("@");

    if (atIndex > 0) {
      return {
        name: pkg.substring(0, atIndex),
        version: pkg.substring(atIndex + 1),
      };
    } else {
      return {
        name: pkg,
        version: "latest",
      };
    }
  }
}

/**
 * Check if a diagram type is enabled in settings
 * Supports: boolean, array of types, or object config
 */
function isDiagramTypeEnabled(settings: Settings, diagramType: 'mermaid' | 'graphviz'): boolean {
  const diagrams = settings.integrations?.diagrams;

  // If diagrams is just true, all types are enabled
  if (diagrams === true) {
    return true;
  }

  // If diagrams is an array, check if the type is included
  if (Array.isArray(diagrams) && diagrams.includes(diagramType)) {
    return true;
  }

  // If diagrams is an object, check if the type is configured
  if (typeof diagrams === 'object' && diagrams !== null && !Array.isArray(diagrams)) {
    if (diagramType in diagrams) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to conditionally return a package based on diagram type
 */
function conditionalDiagramPackage(diagramType: 'mermaid' | 'graphviz', packageName: string) {
  return (settings: Settings): string | null => {
    return isDiagramTypeEnabled(settings, diagramType) ? packageName : null;
  };
}

/**
 * Resolve package list by calling any functions with settings
 * Returns only the packages that should be installed (filters out null/false/undefined)
 */
function resolvePackages(packages: ComponentConfigPackage[], settings: Settings): string[] {
  const resolved: string[] = [];

  for (const pkg of packages) {
    if (typeof pkg === 'function') {
      const result = pkg(settings);
      if (result) {
        resolved.push(result);
      }
    } else {
      resolved.push(pkg);
    }
  }

  return resolved;
}

const xydContentPath = resolveModuleV2(getCLIRoot(), "@xyd-js/content");
const COMPONENTS: Record<string, ComponentConfig> = {
  diagrams: {
    packages: [
      "rehype-mermaid@^3.0.0",
      "playwright@^1.54.2",
      // Conditional packages based on diagram type enabled in settings
      conditionalDiagramPackage('graphviz', '@hpcc-js/wasm@^2.29.0'),
      conditionalDiagramPackage('graphviz', 'rehype-graphviz@^0.3.0'),
    ],
    // postInstall: ['npx playwright install --with-deps chromium'],
    postInstall: ["npx playwright install chromium"],
    xydModules: [xydContentPath || ""],
  },
};

export async function componentsInstall(component: string, host?: boolean) {
  const config = resolveComponent(component, host);
  if (!config) {
    return false;
  }

  await installComponent(config, component);

  if (!host) {
    saveComponent(component);
  }

  return true;
}

function saveComponent(component: string) {
  const cliComponentsJson = getCLIComponentsJsonPath();

  // Check if components.json exists and if diagrams is already enabled
  let shouldWriteJson = true;
  try {
    const existingComponents = JSON.parse(
      readFileSync(cliComponentsJson, "utf8")
    );
    if (existingComponents.diagrams === true) {
      shouldWriteJson = false;
    }
  } catch (error) {
    // File doesn't exist or is invalid JSON, so we should write it
    shouldWriteJson = true;
  }

  const componentsConfig = { [component]: true };
  writeFileSync(cliComponentsJson, JSON.stringify(componentsConfig, null, 2));
  console.debug(
    colors.green(`✅ Components configuration written to ${cliComponentsJson}`)
  );
}

export function resolveComponent(
  component: string,
  host?: boolean
): ComponentConfig | false {
  if (!component) {
    console.error(colors.red("Error: Component name is required"));
    console.log(`Usage: xyd components install <component-name>`);
    console.log(`Available components: ${Object.keys(COMPONENTS).join(", ")}`);
    return false;
  }

  if (!COMPONENTS[component]) {
    console.error(colors.red(`Error: Unknown component '${component}'`));
    console.log(`Available components: ${Object.keys(COMPONENTS).join(", ")}`);
    return false;
  }

  const config = COMPONENTS[component];

  if (host) {
    config.xydModules = [
      path.resolve(getHostPath(), "node_modules/@xyd-js/content"),
      getHostPath(),
    ];
  }

  return config;
}
export function componentDependencies(
    settings: Settings,
    config: ComponentConfig | string,
    host?: boolean,
  ) {
    const deps = {};

    if (typeof config === "string") {
        const resolvedConfig = resolveComponent(config, host);

        if (!resolvedConfig) {
        return false;
        }

        config = resolvedConfig;
    }

    for (const pkg of config.packages) {
        // If package is a function, call it with settings
        if (typeof pkg === "function") {
            if (!settings) {
                console.warn("Package is a function but no settings provided, skipping");
                continue;
            }

            const resolvedPkg = pkg(settings);

            // Skip if package should not be installed (returned null, false, or undefined)
            if (!resolvedPkg) {
                continue;
            }

            const { name, version } = parsePackageString(resolvedPkg);
            deps[name] = version;
            continue;
        }

        const { name, version } = parsePackageString(pkg);
        deps[name] = version;
    }

    return deps;
}

async function installComponent(
  config: ComponentConfig,
  componentName: string,
) {
    const settings = await readSettings();
    if (!settings) {
        console.error(colors.red(`Error: Failed to read settings`));
        process.exit(1);
    }

  function install(pathname: string) {
    if (!config) {
      return;
    }

    console.log("\n", colors.gray(`Installing ${componentName} component...`));

    try {
      // Install packages using the CLI root path
      if (config.packages.length > 0) {
        // Resolve packages to get the actual list that will be installed
        const resolvedPackages = settings ? resolvePackages(config.packages, settings) : [];

        if (resolvedPackages.length > 0) {
          console.log(
            colors.gray(`Installing packages: ${resolvedPackages.join(", ")}`)
          );
        }

        // Update package.json with new dependencies
        const packageJsonPath = join(pathname, "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        const packageJsonOriginal = JSON.parse(
          readFileSync(packageJsonPath, "utf8")
        );

        // Add packages to dependencies
        for (const pkg of config.packages) {
          // If package is a function, call it with settings
          if (typeof pkg === "function") {
            if (!settings) {
              console.warn("Package is a function but no settings provided, skipping");
              continue;
            }

            const resolvedPkg = pkg(settings);

            // Skip if package should not be installed (returned null, false, or undefined)
            if (!resolvedPkg) {
              continue;
            }

            const { name, version } = parsePackageString(resolvedPkg);
            packageJson.dependencies = packageJson.dependencies || {};
            packageJson.dependencies[name] = version;
            continue;
          }

          const { name, version } = parsePackageString(pkg);
          packageJson.dependencies = packageJson.dependencies || {};
          packageJson.dependencies[name] = version;
        }

        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Install packages using documan's nodeInstallPackages
        nodeInstallPackages(pathname);

        // TODO: better solution
        if (process.env.XYD_DEV_MODE) {
          writeFileSync(
            packageJsonPath,
            JSON.stringify(packageJsonOriginal, null, 2)
          );
        }
      }

      // Run post-install commands
      if (config.postInstall) {
        for (const cmd of config.postInstall) {
          console.log(colors.gray(`Running: ${cmd}`));

          const execOptions: ExecSyncOptions = {
            cwd: pathname,
            stdio: "inherit",
            encoding: "utf8",
          };

          if (process.env.XYD_VERBOSE) {
            execOptions.stdio = "inherit";
          }

          execSync(cmd, execOptions);
        }
      }

      console.log(
        colors.green(`✅ ${componentName} component installed successfully!`)
      );
    } catch (error) {
      console.error(
        colors.red(`❌ Failed to install ${componentName} component:`)
      );
      console.error(error);
      process.exit(1);
    }
  }

  for (const module of config.xydModules || []) {
    install(module);
  }
}
