import { CLI } from "./types";
import { getVersion } from "./utils";

// TODO: in the future cli to uniform

export const cliSpec: CLI = {
    name: 'xyd',
    version: getVersion(),
    description: 'Docs platform for future dev',
    usage: 'xyd [globalFlags] [command]',
    commands: {
        dev: {
            description: 'Run your docs locally in development mode',
            usage: 'xyd dev [flags]',
        },
        build: {
            description: 'Build your docs',
            usage: 'xyd build [flags]',
        },
        serve: {
            description: 'Serve your built docs in production mode',
            usage: 'xyd serve [flags]',
        },
        install: {
            description: 'Install the xyd framework manually',
            usage: 'xyd install [flags]',
        },
        migrateme: {
            description: 'Migrate your docs to the new xyd framework',
            usage: 'xyd migrateme  <resource> [flags]',
        },
        components: {
            description: 'Manage xyd components',
            usage: 'xyd components <subcommand> [args] [flags]',
        },
        completion: {
            description:
                'Generate shell completions or the CLI OpenCLI document. ' +
                'Run `xyd completion <zsh|fish>` to print a script, `xyd completion install [shell]` to install it, or `xyd completion opencli` to print the OpenCLI document.',
            usage: 'xyd completion <shell> [flags]',
        },
    },
    globalFlags: {
        'help': {
            alias: 'h',
            type: 'Boolean',
            description: 'Print this help message and exit',
        },
        'version': {
            alias: 'v',
            type: 'Boolean',
            description: 'Print the CLI version and exit',
        },
        'verbose': {
            type: 'Boolean',
            description: 'Enable verbose output',
        },
        'port': {
            alias: 'p',
            type: 'Number',
            description: 'Port to run the dev server on',
        },
        'logLevel': {
            alias: 'l',
            type: 'String',
            description: 'Set logging level (e.g. info, debug)',
        },
        'debug': {
            type: 'Boolean',
            description: 'Enable debug output',
        },
    },
};
