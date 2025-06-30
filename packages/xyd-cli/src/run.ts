import arg from "arg";
import semver from "semver";
import colors from "picocolors";
import {version} from "../package.json";
import updateNotifier from 'update-notifier';
import packageJson from '../package.json' assert {type: 'json'};

import * as commands from "./commands";

const helpText = `
${colors.blueBright("xyd")}

  ${colors.underline("Usage")}:
    $ xyd dev [${colors.yellowBright("projectDir")}]
    $ xyd build [${colors.yellowBright("projectDir")}]
    $ xyd install [${colors.yellowBright("projectDir")}]

  ${colors.underline("Options")}:
    --help, -h          Print this help message and exit
    --version, -v       Print the CLI version and exit
    --verbose           Show debug messages

  ${colors.underline("Run your project locally in development")}:

  $ xyd dev

  ${colors.underline("Build your project")}:

    $ xyd build

  ${colors.underline("Install the xyd framework manually")}:

    $ xyd install
`;

const notifier = updateNotifier({
    pkg: {
        ...packageJson,
    },
    updateCheckInterval: 60 * 60 * 1,
});
notifier.notify({
    defer: false,
});

/**
 * Programmatic interface for running the xyd CLI with the given command line
 * arguments.
 */
export async function run(argv: string[] = process.argv.slice(2)) {
    process.env.XYD_CLI = "true"

    // Check the node version
    const versions = process.versions;
    const MINIMUM_NODE_VERSION = 22;
    if (
        versions &&
        versions.node &&
        semver.major(versions.node) < MINIMUM_NODE_VERSION
    ) {
        console.warn(
            `️⚠️ Oops, Node v${versions.node} detected. xyd requires ` +
            `a Node version greater than ${MINIMUM_NODE_VERSION}.`
        );
    }

    let args = arg(
        {
            "--help": Boolean,
            "-h": "--help",
            "--version": Boolean,
            "-v": "--version",
            "--port": Number,
            "-p": "--port",
            "--logLevel": String,
            "-l": "--logLevel",
            "--verbose": Boolean,
            "--debug": Boolean,
        },
        {
            argv,
        }
    );

    if (args["--verbose"]) {
        process.env.XYD_VERBOSE = "true"
    } else {
        // Override console.debug to be silent when not in verbose mode
        console.debug = () => {
        };
    }

    let input = args._;

    let flags: any = Object.entries(args).reduce((acc, [key, value]) => {
        key = key.replace(/^--/, "");
        acc[key] = value;
        return acc;
    }, {} as any);

    if (flags.help) {
        console.log(helpText);
        return;
    }
    if (flags.version) {
        console.log(version);
        return;
    }

    let command = input[0];

    // Note: Keep each case in this switch statement small.
    switch (command) {
        case "dev":
            await commands.dev(input[1], flags);
            break;
        case "build":
            await commands.build(input[1], flags);
            break;
        case "install":
            await commands.install(input[1], flags);
            break;
        default:
            // `xyd` is shorthand for `xyd dev`
            await commands.dev(input[0], flags);
    }
}
