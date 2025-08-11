import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import colors from 'picocolors';

import { cliSpec } from './spec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

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
