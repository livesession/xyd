import arg from 'arg';
import { cliSpec, CLISpec, FlagType } from './cli-spec';

// Helper type to map flag types to TypeScript types
type FlagTypeMap<T extends FlagType> =
    T extends 'Boolean' ? boolean :
    T extends 'Number' ? number :
    string;

// Create a type derived from cliSpec.globalFlags
export type GlobalFlags = {
    [K in keyof typeof cliSpec.globalFlags]: FlagTypeMap<typeof cliSpec.globalFlags[K]['type']>;
};

export type Args = {
    globalFlags: GlobalFlags;
    commands: string[];
};

export function parseArgs(argv: string[]): Args {
    // Build the arg spec from cliSpec, adding -- prefix to flag names and - prefix to aliases
    const argSpec = Object.fromEntries(
        Object.entries(cliSpec.globalFlags).flatMap(([flag, meta]) => {
            const type = getArgType(meta.type);
            const flagWithPrefix = `--${flag}`;
            const entries: [string, any][] = [[flagWithPrefix, type]];
            if (meta.alias) entries.push([`-${meta.alias}`, flagWithPrefix]);
            return entries;
        })
    );

    const parsed = arg(argSpec, { argv });

    // Extract commands (positional arguments)
    const commands = parsed._;

    // Convert flags to the expected format (remove -- prefix)
    const globalFlags = Object.fromEntries(
        Object.entries(parsed)
            .filter(([key]) => key !== '_') // Exclude positional arguments
            .map(([key, value]) => [key.replace(/^--/, ''), value])
    ) as GlobalFlags;

    return { globalFlags, commands };
}

function getArgType(flagType: FlagType): any {
    switch (flagType) {
        case 'Boolean': return Boolean;
        case 'Number': return Number;
        case 'String': return String;
        default: return String;
    }
} 