import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';

import colors from 'picocolors';

import { fish, zsh, type Shell } from '@xyd-js/opencli-completion';

import { cliToOpencli } from '../completion-parser';
import { cliSpec } from '../spec';

const SHELLS: Shell[] = ['zsh', 'fish'];

/**
 * `xyd completion [<shell>|install|opencli]`
 * - `xyd completion [zsh|fish]` — print the completion script (shell auto-detected from $SHELL)
 * - `xyd completion install [shell]` — write it to the conventional location + enable instructions
 * - `xyd completion opencli` — print the OpenCLI document derived from the CLI
 */
export async function completion(args: string[], _flags: any) {
    const sub = args[0];
    const opencli = cliToOpencli(cliSpec);

    if (sub === 'opencli') {
        console.log(JSON.stringify(opencli, null, 2));
        return;
    }

    if (sub === 'install') {
        installCompletion(resolveShell(args[1]), opencli);
        return;
    }

    console.log(scriptFor(opencli, resolveShell(sub)));
}

function scriptFor(opencli: ReturnType<typeof cliToOpencli>, shell: Shell): string {
    return shell === 'fish' ? fish(opencli) : zsh(opencli);
}

function resolveShell(arg?: string): Shell {
    const candidate = (arg || basename(process.env.SHELL || '')).toLowerCase();
    if (candidate === 'fish') return 'fish';
    if (candidate === 'zsh') return 'zsh';
    if (arg) {
        console.error(colors.yellow(`Unknown shell '${arg}'; supported: ${SHELLS.join(', ')}. Defaulting to zsh.`));
    }
    return 'zsh';
}

function completionPath(shell: Shell): string {
    const name = cliSpec.name;
    if (shell === 'fish') return join(homedir(), '.config', 'fish', 'completions', `${name}.fish`);
    return join(homedir(), '.config', name, 'completions', `_${name}`);
}

function installCompletion(shell: Shell, opencli: ReturnType<typeof cliToOpencli>) {
    const target = completionPath(shell);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, scriptFor(opencli, shell));
    console.log(colors.green(`✓ wrote ${shell} completion to ${target}`));

    if (shell === 'fish') {
        console.log('fish autoloads it — open a new shell to use it.');
        return;
    }
    const dir = dirname(target).replace(homedir(), '~');
    console.log('Add to your ~/.zshrc (once):');
    console.log(colors.cyan(`  fpath=(${dir} $fpath)`));
    console.log(colors.cyan('  autoload -U compinit; compinit'));
    console.log('then open a new shell to use it.');
}
