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
    // 'install' owns a subcommand → "install <command>"; 'internal' (hidden) excluded
    expect(titles).toEqual(['install <command>', 'install dev', 'list']);
  });

  it('builds Arguments/Options/Commands definitions with required + alias info', () => {
    const install = opencliToReferences(spec).find((r) => r.title === 'install <command>')!;
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

  it('nests a subcommand under "Commands" > <parent>, keeping leaf commands direct', () => {
    const refs = opencliToReferences(spec);
    const groupOf = (title: string) => refs.find((r) => r.title === title)!.context.group;
    // a leaf top-level command sits directly under "Commands"
    expect(groupOf('list')).toEqual(['Commands']);
    // a command that owns subcommands becomes a nested group named after itself...
    expect(groupOf('install <command>')).toEqual(['Commands', 'install']);
    // ...and its subcommand sits inside that same group
    expect(groupOf('install dev')).toEqual(['Commands', 'install']);
  });

  it('renders one CLI Tool example per accepted value (an example-level switcher, not codeblock tabs)', () => {
    const cliSpec: OpencliSpecJson = {
      opencli: '1.0.0',
      info: { title: 'xyd', version: '1.0.0' },
      commands: [
        {
          name: 'completion',
          description: 'Generate shell completions.',
          arguments: [{ name: 'shell', required: true, acceptedValues: ['zsh', 'fish'] }],
        },
      ],
    };
    const group = opencliToReferences(cliSpec)[0].examples.groups[0];
    // one example per value (labelled by codeblock.title) so Atlas renders an
    // example switcher — not language tabs inside a single code block
    expect(group.examples.map((e) => e.codeblock.title)).toEqual(['zsh', 'fish']);
    expect(group.examples.map((e) => e.codeblock.tabs[0].code)).toEqual(['xyd completion zsh', 'xyd completion fish']);
  });

  it('labels the CLI Tool example with a single example value too (e.g. a [diagrams] tab)', () => {
    const cliSpec: OpencliSpecJson = {
      opencli: '1.0.0',
      info: { title: 'xyd', version: '1.0.0' },
      commands: [
        {
          name: 'install',
          description: 'Install a component.',
          arguments: [{ name: 'component', required: true, metadata: [{ name: 'example', value: 'diagrams' }] }],
        },
      ],
    };
    const examples = opencliToReferences(cliSpec)[0].examples.groups[0].examples;
    expect(examples).toHaveLength(1);
    expect(examples[0].codeblock.title).toBe('diagrams'); // rendered as a [diagrams] tab
    expect(examples[0].codeblock.tabs[0].code).toBe('xyd install diagrams');
  });

  it('marks refs as the CLI category and surfaces an argument example/enum in its meta', () => {
    const cliSpec: OpencliSpecJson = {
      opencli: '1.0.0',
      info: { title: 'xyd', version: '1.0.0' },
      commands: [
        {
          name: 'components',
          description: 'Manage components.',
          commands: [
            {
              name: 'install',
              description: 'Install a component.',
              arguments: [{ name: 'component', required: true, metadata: [{ name: 'example', value: 'diagrams' }] }],
            },
          ],
        },
        {
          name: 'completion',
          description: 'Shell completions.',
          arguments: [{ name: 'shell', required: true, acceptedValues: ['zsh', 'fish'] }],
        },
      ],
    };
    const refs = opencliToReferences(cliSpec);

    // the parent (command group) reads as "components <command>" and keeps a stable URL
    const parent = refs.find((r) => r.canonical === 'components')!;
    expect(parent.title).toBe('components <command>');
    expect(parent.context.fullPath).toBe('xyd components <command>');
    // its CLI Tool sample shows the subcommand placeholder too (unquoted)
    expect(parent.examples.groups[0].examples[0].codeblock.tabs[0].code).toBe('xyd components <command>');

    const install = refs.find((r) => r.title === 'components install')!;
    expect(install.category).toBe('cli');
    expect(install.context.fullPath).toBe('xyd components install <component>'); // the usage formula
    // example metadata → an "example" badge in the Arguments section
    expect(install.definitions.find((d) => d.title === 'Arguments')!.properties[0].meta).toEqual([
      { name: 'required', value: 'true' },
      { name: 'example', value: 'diagrams' },
    ]);
    // acceptedValues → an "examples" badge list
    const shell = refs.find((r) => r.title === 'completion')!;
    expect(shell.definitions.find((d) => d.title === 'Arguments')!.properties[0].meta).toEqual([
      { name: 'required', value: 'true' },
      { name: 'examples', value: ['zsh', 'fish'] },
    ]);
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

  it('renders root recursive options on each command when globalOptionsPerCommand is true', () => {
    const ref = opencliToReferences(withGlobals, { globalOptionsPerCommand: true })[0];
    const byTitle = Object.fromEntries(ref.definitions.map((d) => [d.title, d]));
    expect(Object.keys(byTitle)).toContain('Global options');
    // recursive + visible only; the hidden one and the non-recursive one are excluded
    expect(byTitle['Global options'].properties.map((p) => p.name)).toEqual(['--help', '--cwd']);
    // no separate page in this mode
    expect(opencliToReferences(withGlobals, { globalOptionsPerCommand: true }).some((r) => r.title === 'Global options')).toBe(false);
  });

  it('by default renders global options as a single dedicated page, not per command', () => {
    const refs = opencliToReferences(withGlobals);
    // no per-command "Global options" section
    const build = refs.find((r) => r.title === 'build')!;
    expect(build.definitions.map((d) => d.title)).not.toContain('Global options');
    // a single "Global options" page instead, grouped on its own in the sidebar
    const page = refs.find((r) => r.title === 'Global options')!;
    expect(page).toBeTruthy();
    expect(page.canonical).toBe('global-options');
    expect(page.context.group).toEqual(['Global options']);
    expect(page.definitions[0].properties.map((p) => p.name)).toEqual(['--help', '--cwd']);
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
