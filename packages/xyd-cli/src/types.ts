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

    /**
     * The command's positional arguments. Preferred over parsing them out of
     * `usage` — lets an argument carry a description and an example value
     * (e.g. a path rather than a generic placeholder).
     */
    arguments?: CLIArgument[];

    /**
     * Nested subcommands, keyed by name (e.g. `components install`).
     */
    commands?: Record<string, CLICommand<F>>;
}

export interface CLIArgument {
    /**
     * The argument name (rendered as `<name>` in usage).
     */
    name: string;

    /**
     * What the argument is for.
     */
    description?: string;

    /**
     * Whether the argument must be provided.
     */
    required?: boolean;

    /**
     * A representative value shown in the generated example invocation
     * (e.g. `./path-to-docs`). Falls back to a generic placeholder.
     */
    example?: string;

    /**
     * A closed set of accepted values.
     */
    acceptedValues?: string[];
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