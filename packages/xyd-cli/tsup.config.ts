import {execSync} from 'child_process';

import {fileURLToPath} from "node:url";
import path from "node:path";
import {mkdirSync, existsSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

import {defineConfig} from 'tsup';

import cliPkg from './package.json';
import atlasPkg from '../xyd-atlas/package.json';
import componentsPkg from '../xyd-components/package.json';
import contentPkg from '../xyd-content/package.json';
import corePkg from '../xyd-core/package.json';
import documanPkg from '../xyd-documan/package.json';
import fooPkg from '../xyd-foo/package.json';
import frameworkPkg from '../xyd-framework/package.json';
import gqlPkg from '../xyd-gql/package.json';
import oapPkg from '../xyd-openapi/package.json';
import pluginZeroPkg from '../xyd-plugin-zero/package.json';
import themeGustoPkg from '../xyd-theme-gusto/package.json';
import themePoetryPkg from '../xyd-theme-poetry/package.json';
import themeOpenerPkg from '../xyd-theme-opener/package.json';
import uiPkg from '../xyd-ui/package.json';
import uniformPkg from '../xyd-uniform/package.json';
import sourcesPk from '../xyd-sources/package.json';

const entry = ["index.ts"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deps = {
    normal: {
        ...cliPkg.dependencies,
        ...atlasPkg.dependencies,
        ...componentsPkg.dependencies,
        ...contentPkg.dependencies,
        ...corePkg.dependencies,
        ...documanPkg.dependencies,
        ...fooPkg.dependencies,
        ...frameworkPkg.dependencies,
        ...gqlPkg.dependencies,
        ...oapPkg.dependencies,
        ...pluginZeroPkg.dependencies,
        ...themeGustoPkg.dependencies,
        ...themePoetryPkg.dependencies,
        ...themeOpenerPkg.dependencies,
        ...uiPkg.dependencies,
        ...uniformPkg.dependencies,
        ...sourcesPk.dependencies,
    },
    dev: {
        ...cliPkg.devDependencies,
        ...atlasPkg.devDependencies,
        ...componentsPkg.devDependencies,
        ...contentPkg.devDependencies,
        ...corePkg.devDependencies,
        ...documanPkg.devDependencies,
        ...fooPkg.devDependencies,
        ...frameworkPkg.devDependencies,
        ...gqlPkg.devDependencies,
        ...oapPkg.devDependencies,
        ...pluginZeroPkg.devDependencies,
        ...themeGustoPkg.devDependencies,
        ...themePoetryPkg.devDependencies,
        ...themeOpenerPkg.devDependencies,
        ...uiPkg.devDependencies,
        ...uniformPkg.devDependencies,
        ...sourcesPk.devDependencies,
    }
}

const external = [
    ...Object.keys(deps.normal),
    ...Object.keys(deps.dev),

    // below should be added somewhere
    "@react-router/express"
].filter((dep) => [
    atlasPkg.name,
    componentsPkg.name,
    contentPkg.name,
    corePkg.name,
    documanPkg.name,
    fooPkg.name,
    frameworkPkg.name,
    gqlPkg.name,
    oapPkg.name,
    pluginZeroPkg.name,
    themeGustoPkg.name,
    themePoetryPkg.name,
    uiPkg.name,
    uniformPkg.name,
].indexOf(dep) === -1)

function replaceWorkspaceDependencies(packageJsonPath: string) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = packageJson.dependencies || {};

    for (const [key, value] of Object.entries(dependencies)) {
        if (value === 'workspace:*') {
            const packagePath = join(__dirname, `../${key.replace('@xyd-js/', 'xyd-')}/package.json`);
            const packageVersion = JSON.parse(readFileSync(packagePath, 'utf-8')).version;
            dependencies[key] = packageVersion;
        }
    }

    packageJson.dependencies = dependencies;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

export default defineConfig([
    {
        clean: true,
        bundle: true,
        entry,
        format: ['esm'], // Output both ESM and CJS formats
        platform: "node",
        outDir: "dist",
        dts: true,
        external,
        plugins: [],
        onSuccess: async () => {
            // TODO: DEV AND PROD MOD
            const cliDir = join(__dirname, process.env.XYD_DEV_MODE ? '../../cli' : './.cli');
            const pluginPagesDir = join(cliDir, 'plugins/xyd-plugin-zero/src/pages');

            // Create necessary directories
            [cliDir, pluginPagesDir].forEach(dir => {
                if (!existsSync(dir)) {
                    mkdirSync(dir, {recursive: true});
                }
            });

            // Copy dist folder
            execSync(`cp -r dist/* ${cliDir}`);

            // Copy host folder
            {
                execSync(`rsync -av --exclude-from='../xyd-documan/host/.gitignore' ../xyd-documan/host/ ${cliDir}`);
                if (!process.env.XYD_DEV_MODE) {
                    replaceWorkspaceDependencies(join(cliDir, 'package.json'));
                }
            }

            // Copy plugin-zero pages
            execSync(`cp -r ../xyd-plugin-zero/src/pages/* ${pluginPagesDir}`);

            // TODO: DEV AND PROD MOD
            if (process.env.XYD_DEV_MODE && !process.env.XYD_DEV_CLI_NOINSTALL) {
                execSync(`cd ${cliDir} && pnpm i && pnpm link --global`);
            } else {
                // for prod npm?
            }
        },
    },
]);
