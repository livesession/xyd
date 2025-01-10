import {execSync} from 'child_process';

import {defineConfig} from "tsup";
import {copyFileSync, mkdirSync, existsSync, writeFileSync} from 'fs';
import {join} from 'path';


import cliPkg from './package.json';
import fableWikiPkg from '../fable-wiki/package.json';
import xtokensPkg from '../xtokens/package.json';
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
import uiPkg from '../xyd-ui/package.json';
import uniformPkg from '../xyd-uniform/package.json';

const entry = ["index.ts"];

const deps = {
    normal: {
        ...cliPkg.dependencies,
        ...fableWikiPkg.dependencies,
        ...xtokensPkg.dependencies,
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
        ...uiPkg.dependencies,
        ...uniformPkg.dependencies,
    },
    dev: {
        ...cliPkg.devDependencies,
        ...fableWikiPkg.devDependencies,
        ...xtokensPkg.devDependencies,
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
        ...uiPkg.devDependencies,
        ...uniformPkg.devDependencies,
    }
}

const external = [
    ...Object.keys(deps.normal),
    ...Object.keys(deps.dev),

    // below should be added somewhere
    "@react-router/express"
].filter((dep) => [
    fableWikiPkg.name,
    xtokensPkg.name,
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
            const cliDir = join(__dirname, '.cli');
            const distDir = join(cliDir, 'dist');
            const hostDir = join(cliDir, 'host');
            const pluginPagesDir = join(cliDir, 'plugins/xyd-plugin-zero/src/pages');

            // Create necessary directories
            [cliDir, distDir, hostDir, pluginPagesDir].forEach(dir => {
                if (!existsSync(dir)) {
                    mkdirSync(dir, {recursive: true});
                }
            });

            // Copy dist folder
            execSync(`cp -r dist/* ${distDir}`);

            // Copy host folder
            execSync(`cp -r ../xyd-documan/host/* ${hostDir}`);

            // Copy plugin-zero pages
            execSync(`cp -r ../xyd-plugin-zero/src/pages/* ${pluginPagesDir}`);

            // Combine package.json dependencies

            const cliPkgs = {
                normal: Object.keys(deps.normal).reduce((acc, dep) => {
                    if (dep.startsWith('@xyd-js')) {
                        return acc;
                    }

                    acc[dep] = deps.normal[dep];

                    return acc
                }, {}),
                dev: Object.keys(deps.dev).reduce((acc, dep) => {
                    if (dep.startsWith('@xyd-js')) {
                        return acc;
                    }

                    acc[dep] = deps.dev[dep];

                    return acc
                }, {})
            }
        },
    },
]);
