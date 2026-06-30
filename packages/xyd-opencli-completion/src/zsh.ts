import type { OpencliSpecJson } from '@xyd-js/opencli';

import { splitFlags } from './flags';
import { opencliToTree } from './tree';
import type { CompletionOption } from './types';

// Inside an `_arguments` spec's `[...]` description: escape backslash, single
// quote, and the chars that are syntactically special there (`:` `[` `]` `{` `}`).
const escZshSpec = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/[:[\]{}]/g, (c) => `\\${c}`);

// Inside a `_describe` `'value:desc'` row only the `:` separator (plus quote /
// backslash) is special — brackets/braces are literal.
const escZshDescribe = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/:/g, '\\:');

function optToSpec(opt: CompletionOption): string {
  const { short, long } = splitFlags(opt.flags);
  const desc = opt.description ? `[${escZshSpec(opt.description)}]` : '';
  const value = opt.takesValue ? ':value:' : '';
  const all = [...short.map((s) => `-${s}`), ...long.map((l) => `--${l}`)];
  if (all.length >= 2) {
    return `'(${all.join(' ')})'{${all.join(',')}}'${desc}${value}'`;
  }
  return `'${all[0]}${desc}${value}'`;
}

/** Generate a zsh completion script (`#compdef`) from an OpenCLI document. */
export function zsh(spec: OpencliSpecJson): string {
  const tree = opencliToTree(spec);
  const cmd = tree.name;
  const subs = Object.values(tree.commands);
  const hasSubs = subs.length > 0;
  const out = [`#compdef ${cmd}`, '', `_${cmd}() {`];

  out.push('  local context state state_descr line');
  out.push('  typeset -A opt_args');
  out.push('');

  const rootSpecs = tree.options.map(optToSpec);
  if (hasSubs) {
    rootSpecs.push("'1: :->command'");
    rootSpecs.push("'*::arg:->args'");
  }
  out.push('  _arguments -C \\');
  out.push(`${rootSpecs.map((s) => `    ${s}`).join(' \\\n')} && return 0`);

  if (hasSubs) {
    out.push('');
    out.push('  case $state in');
    out.push('    command)');
    out.push('      local -a commands');
    out.push('      commands=(');
    for (const sub of subs) {
      out.push(`        '${sub.name}:${escZshDescribe(sub.description || '')}'`);
    }
    out.push('      )');
    out.push(`      _describe -t commands '${cmd} command' commands`);
    out.push('      ;;');
    out.push('    args)');
    out.push('      case $line[1] in');
    for (const sub of subs) {
      out.push(`        ${sub.name})`);
      const specs = sub.options.map(optToSpec);
      if (specs.length) {
        out.push('          _arguments \\');
        out.push(specs.map((s) => `            ${s}`).join(' \\\n'));
      } else {
        out.push("          _message 'no more arguments'");
      }
      out.push('          ;;');
    }
    out.push('      esac');
    out.push('      ;;');
    out.push('  esac');
  }

  out.push('}');
  out.push('');
  out.push(`_${cmd} "$@"`);
  return `${out.join('\n')}\n`;
}
