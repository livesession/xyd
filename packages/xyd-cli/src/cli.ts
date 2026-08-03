#!/usr/bin/env node
import semver from 'semver';
import updateNotifier from 'update-notifier';

import { MIN_NODE_VERSION } from "./const";
import { cliSpec } from './spec';
import { parseArgs } from './args';
import { getPackageJson, printHelp } from './utils';
import * as globalCommands from './commands';

export async function cli(argv = process.argv.slice(2)) {
    if (!prerequisites()) {
        process.exit(1);
    }

    // Only check for updates in an interactive terminal — never when output is
    // piped/redirected (e.g. `xyd completion zsh > _xyd`), so machine-readable
    // output stays clean. Skip entirely in the compiled binary: it isn't
    // npm-installed (so checking npm for a newer `xyd-js` is meaningless) and has
    // no package.json on disk for update-notifier to read.
    if (process.stdout.isTTY && !(globalThis as any).__xydCompiledBinary) {
        await updateNotify()
    }

    process.env.XYD_CLI = 'true';

    // `opensdk` is a passthrough to an optionally installed toolchain whose own
    // flags (e.g. `--lang`) `arg` would reject as unknown — hand it the raw
    // argv before any parsing. (argv.slice(1), not process.argv: respects the
    // injectable `argv` parameter of cli().)
    if (argv[0] === 'opensdk') {
        return globalCommands.opensdk(argv.slice(1));
    }

    const { globalFlags, commands } = parseArgs(argv);

    if (globalFlags.help) {
        return printHelp();
    }
    if (globalFlags.version) {
        return console.log(cliSpec.version);
    }
    if (!globalFlags.verbose) {
        console.debug = () => {
        };
    }

    const globalCommand = commands[0] || 'dev';

    if (!cliSpec.commands[globalCommand]) {
        console.error(`Unknown command: ${globalCommand}`);
        printHelp();
        process.exit(1);
    }

    const commandArgs = commands.slice(1);

    switch (globalCommand) {
        case 'components':
            // Handle subcommands for components
            await globalCommands.components(commandArgs, globalFlags);
            break;
        case 'opensdk':
            // Reached only when a known global flag preceded the command (e.g.
            // `xyd --verbose opensdk gen`) — globals are consumed by `arg` and
            // not forwarded; the canonical form is `xyd opensdk ...` first.
            await globalCommands.opensdk(commandArgs);
            break;
        case 'completion':
            // Pass the raw args array (shell name / subcommand)
            await globalCommands.completion(commandArgs, globalFlags);
            break;
        default:
            await (globalCommands[globalCommand as keyof typeof globalCommands] as any)(...commandArgs, globalFlags);
    }
}

function prerequisites() {
    const nodeVersion = process.versions.node;
    if (semver.major(nodeVersion) < MIN_NODE_VERSION) {
        console.warn(`⚠️ Node ${nodeVersion} is too old. xyd requires Node >= 22.`);
        return
    }

    return true
}

function updateNotify() {
    const packageJson = getPackageJson();
    const notifier = updateNotifier({
        pkg: packageJson,
        updateCheckInterval: 1000 * 60 * 60 * 1, // 1 hour
    });

    notifier.notify({ defer: false });
}