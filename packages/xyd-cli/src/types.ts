export type FlagType = 'Boolean' | 'String' | 'Number';

export interface CLI {
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
    commands: Record<string, CLICommand>

    /**
     * The global flags of the CLI
     */
    globalFlags: Record<string, CLIGlobalFlag>;
}

export interface CLICommand<F = null> {
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

export interface CLIGlobalFlag {
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