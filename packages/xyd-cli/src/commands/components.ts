import colors from 'picocolors';

import { componentsInstall } from '@xyd-js/documan';

/** A `components <subcommand>` handler. Receives the args *after* the subcommand. */
type ComponentsSubcommand = (args: string[], flags: Record<string, unknown>) => Promise<void>;

/**
 * The `components` subcommand registry — the single source of truth for what
 * `components <subcommand>` accepts. Add a key to introduce a new subcommand;
 * the dispatcher and the "available subcommands" help are derived from it.
 */
const subcommands = {
    // `components install <component>`
    install: async (args) => {
        const componentName = args[0];

        const success = await componentsInstall(componentName);
        if (!success) {
            process.exit(1);
        }
    },
} satisfies Record<string, ComponentsSubcommand>;

type ComponentsSubcommandName = keyof typeof subcommands;

function isSubcommand(name: string | undefined): name is ComponentsSubcommandName {
    return name != null && name in subcommands;
}

export async function components(args: string[], flags: Record<string, unknown>) {
    const [subcommand, ...rest] = args;

    if (!isSubcommand(subcommand)) {
        console.error(colors.red(`Error: Unknown subcommand '${subcommand ?? ''}'`));
        console.log(`Available subcommands: ${Object.keys(subcommands).join(', ')}`);
        process.exit(1);
        return;
    }

    await subcommands[subcommand](rest, flags);
}
