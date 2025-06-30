#!/usr/bin/env node
import semver from 'semver';
import updateNotifier from 'update-notifier';

import {MIN_NODE_VERSION} from "./const";
import {cliSpec} from './cli-spec';
import {parseArgs} from './args';
import {getPackageJson, printHelp} from './utils';
import * as globalCommands from './commands';

export async function cli(argv = process.argv.slice(2)) {
    if (!prerequisites()) {
        process.exit(1);
    }

    updateNotify()

    process.env.XYD_CLI = 'true';

    const {globalFlags, commands} = parseArgs(argv);

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

    await globalCommands[globalCommand as keyof typeof globalCommands](globalFlags);
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
    const notifier = updateNotifier({pkg: packageJson});
    notifier.notify();
}