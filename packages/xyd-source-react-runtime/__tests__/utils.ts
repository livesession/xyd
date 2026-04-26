import * as path from 'node:path';
import * as fs from 'node:fs';
import {execSync} from 'node:child_process';
import {expect} from 'vitest';

const fixturesBase = path.resolve(__dirname, '../__fixtures__');

function fullFixturePath(name: string) {
    return path.join(fixturesBase, name);
}

/**
 * Recursively finds all .js files in a directory, sorted by path.
 */
function findJsFiles(dir: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findJsFiles(full));
        } else if (entry.name.endsWith('.js')) {
            files.push(full);
        }
    }
    return files.sort();
}

/**
 * Concatenates all JS files from the build output into a single string,
 * with file separators so you can see the full transformed code.
 */
function collectBuildOutput(buildDir: string, inputRoot: string, propertyName: string = '__xydUniform'): string {
    const jsFiles = findJsFiles(buildDir);
    const parts: string[] = [];

    for (const file of jsFiles) {
        const relativePath = path.relative(buildDir, file);
        const code = fs.readFileSync(file, 'utf-8');

        if (!code.includes(propertyName)) continue;

        parts.push(`// === ${relativePath} ===`);
        parts.push(code);
        parts.push('');
    }

    return parts.join('\n')
        .split(inputRoot).join('<ROOT>')
        .replace(/[-_\w]+-[A-Za-z0-9_-]{6,10}\.(js|css)/g, (match) => {
            // Normalize content hashes in filenames: home-BpHCO2Vo.js → home-HASH.js
            return match.replace(/-[A-Za-z0-9_-]{6,10}\./, '-HASH.');
        });
}

/**
 * Builds a fixture app by running its `build` script from package.json,
 * then snapshots the full build output code.
 *
 * Each fixture is a real app with its own framework config and build command.
 */
export async function testSourceReactRuntime(fixtureName: string, propertyName: string = '__xydUniform') {
    const inputRoot = fullFixturePath(`${fixtureName}/input`);

    // Clean previous build outputs
    for (const dir of ['dist', 'build', '.react-router']) {
        const p = path.resolve(inputRoot, dir);
        if (fs.existsSync(p)) fs.rmSync(p, {recursive: true, force: true});
    }

    // Run the fixture's own build script — just like a real consumer would
    execSync('pnpm build', {cwd: inputRoot, stdio: 'pipe', timeout: 60_000});

    // Find the build output directory (varies by framework)
    let buildDir = path.resolve(inputRoot, 'dist');
    if (!fs.existsSync(buildDir)) {
        buildDir = path.resolve(inputRoot, 'build');
    }

    // Collect full build output code
    const result = collectBuildOutput(buildDir, inputRoot, propertyName);

    // Verify at least one component was injected
    expect(result).toContain(propertyName);

    // Save snapshot
    const snapshotPath = fullFixturePath(`${fixtureName}/output.js`);
    // fs.writeFileSync(snapshotPath, result);

    // Compare
    const expected = fs.readFileSync(snapshotPath, 'utf8');
    expect(result).toEqual(expected);

    // Cleanup
    for (const dir of ['dist', 'build', '.react-router']) {
        const p = path.resolve(inputRoot, dir);
        if (fs.existsSync(p)) fs.rmSync(p, {recursive: true, force: true});
    }
}
