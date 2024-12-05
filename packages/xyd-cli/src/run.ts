import arg from "arg";
import semver from "semver";
import colors from "picocolors";

import * as commands from "./commands";

const helpText = `
${colors.blueBright("xyd")}

  ${colors.underline("Usage")}:
    $ xyd build [${colors.yellowBright("projectDir")}]
    $ xyd dev [${colors.yellowBright("projectDir")}]

  ${colors.underline("Options")}:
    --help, -h          Print this help message and exit
    --version, -v       Print the CLI version and exit
    --no-color          Disable ANSI colors in console output
  \`build\` Options:
    --logLevel, -l      Info | warn | error | silent (string)
  \`dev\` Options:
    --port              Specify port (number)

  ${colors.underline("Build your project")}:

    $ xyd build

  ${colors.underline("Run your project locally in development")}:

    $ xyd dev
`;

/**
 * Programmatic interface for running the xyd CLI with the given command line
 * arguments.
 */
export async function run(argv: string[] = process.argv.slice(2)) {
    // Check the node version
    let versions = process.versions;
    let MINIMUM_NODE_VERSION = 20;
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
        },
        {
            argv,
        }
    );

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
        let version = require("../package.json").version;
        console.log(version);
        return;
    }

    let command = input[0];

    // Note: Keep each case in this switch statement small.
    switch (command) {
        case "build":
            await commands.build(input[1], flags);
            break;
        case "dev":
            await commands.dev(input[1], flags);
            break;
        default:
            // `xyd ./my-project` is shorthand for `xyd dev ./my-project`
            await commands.dev(input[0], flags);
    }
}
