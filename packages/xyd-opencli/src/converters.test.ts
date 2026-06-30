import { describe, expect, it } from 'vitest';

import { opencliToReferences } from './converters';
import type { OpencliSpecJson } from './types';

const spec: OpencliSpecJson = {
  opencli: '1.0.0',
  info: { title: 'spice', version: '1.0.0' },
  commands: [
    {
      name: 'install',
      description: 'Install one or more packages.',
      arguments: [{ name: 'packages', required: true, description: 'Packages to install.' }],
      options: [
        { name: 'global', aliases: ['g'], description: 'Install globally.' },
        { name: 'save-dev', description: 'Add to devDependencies.' },
        { name: 'secret', description: 'hidden', hidden: true },
      ],
      commands: [{ name: 'dev', description: 'Install as a dev dependency.' }],
    },
    { name: 'list', description: 'List installed packages.' },
    { name: 'internal', description: 'hidden', hidden: true },
  ],
};

describe('opencliToReferences', () => {
  it('emits one reference per (visible) command, including nested', () => {
    const refs = opencliToReferences(spec);
    const titles = refs.map((r) => r.title).sort();
    expect(titles).toEqual(['install', 'install dev', 'list']); // 'internal' (hidden) excluded
  });

  it('builds Arguments/Options/Commands definitions with required + alias info', () => {
    const install = opencliToReferences(spec).find((r) => r.title === 'install')!;
    expect(install.canonical).toBe('install');
    expect(install.description).toBe('Install one or more packages.');

    const byTitle = Object.fromEntries(install.definitions.map((d) => [d.title, d]));
    expect(Object.keys(byTitle).sort()).toEqual(['Arguments', 'Commands', 'Options']);

    // argument required meta
    const packages = byTitle.Arguments.properties[0];
    expect(packages.name).toBe('packages');
    expect(packages.meta).toEqual([{ name: 'required', value: 'true' }]);

    // options: kebab name with `--`, alias note, hidden one dropped
    const optNames = byTitle.Options.properties.map((p) => p.name);
    expect(optNames).toEqual(['--global', '--save-dev']); // 'secret' (hidden) excluded
    expect(byTitle.Options.properties[0].description).toContain('alias: -g');

    // nested subcommand listed
    expect(byTitle.Commands.properties.map((p) => p.name)).toEqual(['dev']);

    // context.path is the region key the engine round-trips
    expect(install.context.path).toBe('install');

    // a runnable CLI invocation is emitted as a "CLI Tool" code sample
    const tab = install.examples.groups[0].examples[0].codeblock.tabs[0];
    expect(tab.title).toBe('CLI Tool');
    expect(tab.language).toBe('shell');
    expect(tab.code).toContain('spice install');
    // required positional arg filled with a value, no required options here
    expect(tab.code).toContain("'Example data'");
  });

  it('fills required options with example/enum values', () => {
    const cliSpec: OpencliSpecJson = {
      opencli: '1.0.0',
      info: { title: 'openai', version: '1.0.0' },
      commands: [
        {
          name: 'transcribe',
          description: 'Create a transcription.',
          options: [
            { name: 'file', required: true, arguments: [{ name: 'path', required: true }] },
            { name: 'model', required: true, arguments: [{ name: 'id', required: true, acceptedValues: ['gpt-4o-transcribe', 'whisper-1'] }] },
            { name: 'verbose', description: 'noise' },
          ],
        },
      ],
    };
    const code = opencliToReferences(cliSpec)[0].examples.groups[0].examples[0].codeblock.tabs[0].code;
    expect(code).toContain('openai transcribe');
    expect(code).toContain("--file 'Example data'");
    expect(code).toContain('--model gpt-4o-transcribe'); // enum value, unquoted (no spaces)
    expect(code).not.toContain('--verbose'); // optional flag omitted
  });

  it('filters by region (command path)', () => {
    const refs = opencliToReferences(spec, { regions: ['install dev'] });
    expect(refs.map((r) => r.title)).toEqual(['install dev']);
    expect(refs[0].context.path).toBe('install dev');
  });

  it('renders an "Example response" group from the x-openapi response binding', () => {
    const withResponse: OpencliSpecJson = {
      opencli: '1.0.0',
      info: { title: 'openai', version: '1.0.0' },
      commands: [
        {
          name: 'retrieve',
          description: 'Retrieve a thing.',
          'x-openapi': {
            method: 'get',
            path: '/things/{id}',
            responses: [
              { status: '200', contentType: 'application/json', example: { id: 'thing_123', object: 'thing' } },
            ],
          },
        },
      ],
    };
    const ref = opencliToReferences(withResponse)[0];

    // the CLI Tool invocation stays at groups[0]
    expect(ref.examples.groups[0].examples[0].codeblock.tabs[0].title).toBe('CLI Tool');

    // the response sample becomes a second, separate group (status on the
    // codeblock, contentType on the tab — mirrors the OpenAPI response track)
    const responseGroup = ref.examples.groups[1];
    expect(responseGroup.description).toBe('Example response');
    expect(responseGroup.examples[0].codeblock.title).toBe('200');
    const tab = responseGroup.examples[0].codeblock.tabs[0];
    expect(tab.title).toBe('application/json');
    expect(tab.language).toBe('json');
    expect(JSON.parse(tab.code)).toEqual({ id: 'thing_123', object: 'thing' });
  });

  it('omits the response group when the command has no x-openapi response', () => {
    // the spice fixture carries no x-openapi binding → only the CLI Tool group
    for (const ref of opencliToReferences(spec)) {
      expect(ref.examples.groups).toHaveLength(1);
      expect(ref.examples.groups[0].examples[0].codeblock.tabs[0].title).toBe('CLI Tool');
    }
  });

  it('renders root recursive options as a "Global options" section on each command', () => {
    const withGlobals: OpencliSpecJson = {
      opencli: '1.0.0',
      info: { title: 'demo', version: '1.0.0' },
      options: [
        { name: 'help', aliases: ['h'], description: 'Show help', recursive: true },
        { name: 'cwd', description: 'Working dir', arguments: [{ name: 'path' }], recursive: true },
        { name: 'secret', description: 'hidden', recursive: true, hidden: true },
        { name: 'local', description: 'not a global flag' },
      ],
      commands: [{ name: 'build', description: 'Build it' }],
    };
    const ref = opencliToReferences(withGlobals)[0];
    const byTitle = Object.fromEntries(ref.definitions.map((d) => [d.title, d]));
    expect(Object.keys(byTitle)).toContain('Global options');
    // recursive + visible only; the hidden one and the non-recursive one are excluded
    expect(byTitle['Global options'].properties.map((p) => p.name)).toEqual(['--help', '--cwd']);
  });

  it('emits no "Global options" section when there are no recursive root options', () => {
    for (const ref of opencliToReferences(spec)) {
      expect(ref.definitions.map((d) => d.title)).not.toContain('Global options');
    }
  });

  it('returns [] for null spec', () => {
    expect(opencliToReferences(null)).toEqual([]);
  });
});
