
import colors from 'picocolors';

import { componentsInstall } from '@xyd-js/documan';

export async function components(args: string[], flags: any) {
    const subcommand = args[0];

    if (subcommand === 'install') {
        const componentName = args[1];

        const success = await componentsInstall(componentName);
        if (!success) {
            process.exit(1);
        }
    } else {
        console.error(colors.red(`Error: Unknown subcommand '${subcommand}'`));
        console.log('Available subcommands: install');
        process.exit(1);
    }
}

