import type { OpencliSpecJson } from '@xyd-js/opencli';

import { splitFlags } from './flags';
import { opencliToTree } from './tree';
import type { CompletionNode } from './types';

const escFish = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/** Generate a fish completion script from an OpenCLI document. */
export function fish(spec: OpencliSpecJson): string {
  const tree = opencliToTree(spec);
  const cmd = tree.name;
  const lines = [`# fish completions for ${cmd} (generated - do not edit)`];

  const walk = (node: CompletionNode, path: string[]) => {
    const cond =
      path.length === 0
        ? '__fish_use_subcommand'
        : path.map((p) => `__fish_seen_subcommand_from ${p}`).join('; and ');

    const subs = Object.values(node.commands);
    for (const sub of subs) {
      const d = sub.description ? ` -d '${escFish(sub.description)}'` : '';
      lines.push(`complete -c ${cmd} -n "${cond}" -f -a "${sub.name}"${d}`);
    }
    for (const opt of node.options) {
      const { short, long, old } = splitFlags(opt.flags);
      const parts = [...short.map((s) => `-s ${s}`), ...long.map((l) => `-l ${l}`), ...old.map((o) => `-o ${o}`)].join(' ');
      const r = opt.takesValue ? ' -r' : '';
      const d = opt.description ? ` -d '${escFish(opt.description)}'` : '';
      lines.push(`complete -c ${cmd} -n "${cond}" ${parts}${r}${d}`);
    }
    for (const sub of subs) walk(sub, [...path, sub.name]);
  };

  walk(tree, []);
  return `${lines.join('\n')}\n`;
}
