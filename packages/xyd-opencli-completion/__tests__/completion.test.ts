import type { OpencliSpecJson } from '@xyd-js/opencli';
import { describe, expect, it } from 'vitest';

import { completion, fish, opencliToTree, zsh } from '../index';

const spec: OpencliSpecJson = {
  opencli: '1.0.0',
  info: { title: 'xyd', version: '1.0.0', description: 'Docs platform' },
  options: [
    { name: 'help', aliases: ['h'], description: 'Print help', recursive: true },
    { name: 'port', aliases: ['p'], description: 'Port', arguments: [{ name: 'number' }], recursive: true },
  ],
  commands: [
    { name: 'dev', description: 'Run dev server' },
    { name: 'build', description: 'Build docs' },
  ],
};

describe('opencliToTree', () => {
  it('exposes recursive root options on the root and every command', () => {
    const tree = opencliToTree(spec);
    expect(Object.keys(tree.commands)).toEqual(['dev', 'build']);
    expect(tree.options.map((o) => o.flags)).toEqual([
      ['--help', '-h'],
      ['--port', '-p'],
    ]);
    // global flags propagate into each subcommand
    expect(tree.commands.dev.options.map((o) => o.flags)).toEqual([
      ['--help', '-h'],
      ['--port', '-p'],
    ]);
    expect(tree.commands.dev.options.find((o) => o.flags.includes('--port'))?.takesValue).toBe(true);
  });
});

describe('zsh', () => {
  const out = zsh(spec);
  it('emits a #compdef header, subcommands and option specs', () => {
    expect(out.startsWith('#compdef xyd')).toBe(true);
    expect(out).toContain("'dev:Run dev server'");
    expect(out).toContain("'build:Build docs'");
    expect(out).toContain("'(-h --help)'{-h,--help}'[Print help]'");
    expect(out).toContain("'(-p --port)'{-p,--port}'[Port]:value:'"); // value-taking flag
    expect(out).toContain("'1: :->command'");
  });
});

describe('fish', () => {
  const out = fish(spec);
  it('emits complete lines for subcommands and flags, globals in subcommand context', () => {
    expect(out).toContain('complete -c xyd -n "__fish_use_subcommand" -f -a "dev" -d \'Run dev server\'');
    expect(out).toContain('-s h -l help');
    expect(out).toContain('-s p -l port -r'); // takesValue → -r
    expect(out).toContain('__fish_seen_subcommand_from dev');
  });
});

describe('completion dispatcher', () => {
  it('routes by shell', () => {
    expect(completion(spec, 'zsh')).toBe(zsh(spec));
    expect(completion(spec, 'fish')).toBe(fish(spec));
  });
});
