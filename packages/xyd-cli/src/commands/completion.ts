import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';

import colors from 'picocolors';

import type { OpencliSpecJson } from '@xyd-js/opencli';
import { fish, zsh, type Shell } from '@xyd-js/opencli-completion';
// The OpenCLI document is generated from the TypeSpec source of truth
// (`specs/xyd-cli/xyd.tsp`) and shipped by `@xyd-js/cli-spec` as `opencli.json` —
// the same document the Rust crate embeds. It is BUNDLED into the CLI at build
// time (esbuild inlines the JSON) so the published package stays self-contained;
// re-stringifying with the emitter's exact format keeps `xyd completion opencli`
// byte-identical to that canonical artifact.
import opencliJson from '@xyd-js/cli-spec/opencli.json';

import { cliSpec } from '../spec';

const SHELLS: Shell[] = ['zsh', 'fish'];

const opencli = opencliJson as OpencliSpecJson;

/**
 * `xyd completion [<shell>|install|opencli]`
 * - `xyd completion [zsh|fish]` — print the completion script (shell auto-detected from $SHELL)
 * - `xyd completion install [shell]` — write it to the conventional location + enable instructions
 * - `xyd completion opencli` — print the OpenCLI document (from `@xyd-js/cli-spec`)
 */
export async function completion(args: string[], _flags: any) {
    const sub = args[0];

    if (sub === 'opencli') {
        // Byte-identical passthrough of the generated document (emitter format).
        process.stdout.write(JSON.stringify(opencli, null, 2) + '\n');
        return;
    }

    if (sub === 'install') {
        installCompletion(resolveShell(args[1]), opencli);
        return;
    }

    console.log(scriptFor(opencli, resolveShell(sub)));
}

function scriptFor(opencli: OpencliSpecJson, shell: Shell): string {
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

function installCompletion(shell: Shell, opencli: OpencliSpecJson) {
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
