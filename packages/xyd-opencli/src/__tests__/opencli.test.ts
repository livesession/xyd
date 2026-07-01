import { describe, it, expect } from 'vitest';

import { findCommand, generateUsage, generateOptions, generateArguments } from '../index';
import type { OpencliSpecJson } from '../index';

const spec: OpencliSpecJson = {
  opencli: '1.0.0',
  info: { title: 'spice', version: '1.0.0', description: 'Spice CLI' },
  commands: [
    {
      name: 'install',
      aliases: ['i'],
      description: 'Install a package',
      options: [{ name: 'global', aliases: ['g'], description: 'Install globally' }],
      arguments: [{ name: 'package', required: true, description: 'Package name' }],
      commands: [{ name: 'dev', description: 'Install as dev dependency' }],
    },
  ],
};

describe('@xyd-js/opencli core', () => {
  it('findCommand resolves a top-level command', () => {
    const cmd = findCommand(spec, 'install');
    expect(cmd?.name).toBe('install');
  });

  it('findCommand resolves via alias', () => {
    const cmd = findCommand(spec, 'i');
    expect(cmd?.name).toBe('install');
  });

  it('findCommand resolves a nested command', () => {
    const cmd = findCommand(spec, 'install dev');
    expect(cmd?.name).toBe('dev');
  });

  it('findCommand with empty path returns synthetic root', () => {
    const cmd = findCommand(spec, '');
    expect(cmd?.name).toBe('spice');
    expect(cmd?.commands?.[0]?.name).toBe('install');
  });

  it('generateUsage renders the general form (options + required arg, no subcommand token)', () => {
    const cmd = findCommand(spec, 'install')!;
    expect(generateUsage(spec, cmd, 'spice install')).toBe('spice install [options] <package>');
  });

  it('generateUsage adds the <command> placeholder for a command group when opted in', () => {
    const cmd = findCommand(spec, 'install')!;
    expect(generateUsage(spec, cmd, 'spice install', { commandPlaceholder: true })).toBe(
      'spice install <command> [options] <package>',
    );
  });

  it('generateOptions / generateArguments render tab-indented code style', () => {
    const cmd = findCommand(spec, 'install')!;
    expect(generateOptions(cmd, 'code')).toContain('-g, --global');
    expect(generateArguments(cmd, 'code')).toContain('package');
  });

  it('x-openapi binding survives on the model (typed extension)', () => {
    const withBinding: OpencliSpecJson = {
      ...spec,
      'x-openapi': { servers: ['https://api.example.com/v1'] },
    };
    expect(withBinding['x-openapi']?.servers?.[0]).toBe('https://api.example.com/v1');
  });
});
