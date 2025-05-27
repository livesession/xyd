import { defineConfig } from 'tsup';

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
import pluginDocsPkg from '../xyd-plugin-docs/package.json';
import themeGustoPkg from '../xyd-theme-gusto/package.json';
import themePoetryPkg from '../xyd-theme-poetry/package.json';
import themeOpenerPkg from '../xyd-theme-opener/package.json';
import uiPkg from '../xyd-ui/package.json';
import uniformPkg from '../xyd-uniform/package.json';
import sourcesPk from '../xyd-sources/package.json';

const entry = ["index.ts", "build.ts"];

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
        ...pluginDocsPkg.dependencies,
        ...themeGustoPkg?.dependencies,
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
        ...pluginDocsPkg.devDependencies,
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
    pluginDocsPkg.name,
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
        plugins: []
    },
]);
