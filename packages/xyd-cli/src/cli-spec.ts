import { getVersion } from "./utils";

export type FlagType = 'Boolean' | 'String' | 'Number';

// TODO: in the future cli to uniform

export interface CLISpec {
    /**
     * The name of the CLI
     */
    name: string;

    /**
     * The version of the CLI
     */
    version: string;

    /**
     * The description of the CLI
     */
    description: string;

    /**
     * The usage of the CLI
     */
    usage: string;

    /**
     * The commands of the CLI
     */
    commands: Record<string, CommandSpec>

    /**
     * The global flags of the CLI
     */
    globalFlags: Record<string, GlobalFlagSpec>;
}

export interface CommandSpec<F = null> {
    /**
     * The description of the command
     */
    description: string;

    /**
     * The usage of the command
     */
    usage?: string;

    /**
     * The flags of the command
     */
    flags?: Record<string, F>;
}

export interface GlobalFlagSpec {
    /**
     * The type of the flag
     */
    type: FlagType;

    /**
     * The alias of the flag
     */
    alias?: string;

    /**
     * The description of the flag
     */
    description: string;
}

export const cliSpec: CLISpec = {
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
        install: {
            description: 'Install the xyd framework manually',
            usage: 'xyd install [flags]',
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
