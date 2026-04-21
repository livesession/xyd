import * as path from 'node:path';
import * as fs from 'node:fs';
import {expect} from 'vitest';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {xydSourceReactBabelRuntime} from '../src';

const fixturesBase = path.resolve(__dirname, '../__fixtures__');

function fullFixturePath(name: string) {
    return path.join(fixturesBase, name);
}

function readFixtureOutput(fixtureName: string): string {
    const fixturePath = fullFixturePath(`${fixtureName}/output.js`);
    return fs.readFileSync(fixturePath, 'utf8');
}

function saveResultAsOutput(fixtureName: string, code: string) {
    fs.writeFileSync(
        fullFixturePath(`${fixtureName}/output.js`),
        code,
    );
}

/**
 * Discovers all .ts/.tsx source files under input/src/ relative to inputRoot.
 */
function discoverEntryPoints(inputRoot: string): string[] {
    const srcDir = path.join(inputRoot, 'src');
    const files: string[] = [];

    function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (/\.[jt]sx?$/.test(entry.name)) {
                files.push(path.relative(inputRoot, full));
            }
        }
    }

    walk(srcDir);
    return files.sort();
}

export async function testBabelRuntimePlugin(fixtureName: string) {
    const inputRoot = fullFixturePath(`${fixtureName}/input`);
    const outDir = path.resolve(inputRoot, 'dist');

    const entryPoints = discoverEntryPoints(inputRoot);

    // Prefer src/index.ts as Vite lib entry if it exists, otherwise first file
    const indexEntry = entryPoints.find(f => /^src\/index\.[jt]sx?$/.test(f));
    const libEntry = indexEntry || entryPoints[0];
    await build({
        root: inputRoot,
        logLevel: 'silent',
        build: {
            outDir,
            lib: {
                entry: path.resolve(inputRoot, libEntry),
                formats: ['es'],
                fileName: 'index',
            },
            rollupOptions: {
                external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
            },
            minify: false,
            write: true,
        },
        plugins: [
            xydSourceReactBabelRuntime({
                root: inputRoot,
                entryPoints,
            }),
            react(),
        ],
    });

    // Read the transformed code and normalize absolute paths for portability
    const outputPath = path.resolve(outDir, 'index.js');
    const result = fs.readFileSync(outputPath, 'utf-8').split(inputRoot).join('<ROOT>');

    // Save as output.js for snapshot comparison
    saveResultAsOutput(fixtureName, result);

    // Compare against expected output (if output.js already existed, verify it matches)
    const expectedOutput = readFixtureOutput(fixtureName);

    expect(result).toEqual(expectedOutput);

    // Cleanup build artifacts
    fs.rmSync(outDir, {recursive: true, force: true});
}
