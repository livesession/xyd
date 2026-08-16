import {readFileSync, realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

import colors from 'picocolors';

import {cliSpec} from './spec';

// Injected at compile time for the standalone binary (there's no package.json on
// disk inside the bunfs). Undefined in the node build.
declare const __XYD_CLI_VERSION__: string | undefined;

let packageJson: any = {};

(() => {
    // Every disk access is guarded — inside a `bun --compile` binary process.argv[1]
    // is a read-only bunfs path (e.g. /$bunfs/root/binary.js) that realpathSync +
    // readFileSync can't resolve; the injected version below covers that case.
    try {
        const cliPath = realpathSync(process.argv[1]);
        let packageJsonRaw = "";
        try {
            packageJsonRaw = readFileSync(join(cliPath, 'package.json'), 'utf8')
        } catch (e) {
            try {
                packageJsonRaw = readFileSync(join(cliPath, '..', 'package.json'), 'utf8')
            } catch (e) {
            }
        }
        if (!packageJsonRaw) {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            packageJsonRaw = readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
        }
        packageJson = JSON.parse(packageJsonRaw || "{}")
    } catch (e) {
        packageJson = {}
    }

    if (!packageJson.version && typeof __XYD_CLI_VERSION__ !== 'undefined') {
        packageJson.version = __XYD_CLI_VERSION__
    }
    // Fallback name for the compiled binary (no package.json on disk) — keeps any
    // pkg.name reader (e.g. update-notifier) from throwing.
    if (!packageJson.name) {
        packageJson.name = 'xyd-js'
    }
})();

export function getPackageJson() {
    return packageJson;
}

export function getVersion() {
    return packageJson.version;
}

export function printHelp() {
    console.log(`\n${colors.blueBright(cliSpec.name)} — ${cliSpec.description}\n`);
    console.log(`${colors.underline('Usage')}:\n  ${cliSpec.usage}\n`);

    console.log(`${colors.underline('Global Flags')}:`);
    for (const [flag, meta] of Object.entries(cliSpec.globalFlags)) {
        let flagDisplay: string;
        if (meta.alias) {
            flagDisplay = `  -${meta.alias}, --${flag}`;
        } else {
            flagDisplay = `      --${flag}`;
        }
        console.log(`${flagDisplay.padEnd(20)} ${meta.description}`);
    }

    console.log(`\n${colors.underline('Commands')}:`);
    for (const [cmd, meta] of Object.entries(cliSpec.commands)) {
        console.log(`  ${cmd.padEnd(10)} ${meta.description}`);
    }
    console.log(`\nUse \`--help\` with a command for more info.\n`);
}
