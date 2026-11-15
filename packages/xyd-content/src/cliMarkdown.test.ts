import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { cliPageMarkdown, cliReferenceMarkdown } from './cliMarkdown';

// The `.md` twin of a generated CLI page: the command its frontmatter names
// (`cli: ~/<source>#<command path>`), converted the way the page converts it
// and written out as markdown. An acme host CLI with an agent CLI mounted as
// `acme agent`, and the agent CLI on its own (its root documents a session and
// arguments, so it gets a page of its own).
const ACME = {
    opencli: '1.0.0',
    info: { title: 'acme', version: '1.0.0' },
    options: [
        { name: 'profile', recursive: true, description: 'The profile to use.', arguments: [{ name: 'name', required: true }] },
        { name: 'trace', recursive: true, hidden: true },
    ],
    exitCodes: [
        { code: 0, description: 'Success.' },
        { code: 2, description: 'The service answered with an error.' },
    ],
    commands: [
        {
            name: 'remote',
            description: 'Manage remotes.',
            commands: [{ name: 'list', description: 'List the remotes.' }],
        },
        {
            name: 'agent',
            description: 'Run the agent CLI: every argument after `agent` is its own.',
            arguments: [{ name: 'prompt', description: 'A question to ask right away.' }],
            options: [
                { name: 'model', aliases: ['m'], recursive: true, description: 'The model to answer with.', arguments: [{ name: 'name', required: true }] },
            ],
            examples: ['acme agent', 'acme agent "Which pages are the slowest?"'],
            exitCodes: [{ code: 130, description: 'Interrupted.' }],
            interactive: true,
            'x-interactive': {
                commands: [
                    {
                        name: 'export',
                        description: 'Write the conversation to a file.',
                        arguments: [{ name: 'path', required: true, description: 'Where to write it.' }],
                        options: [{ name: 'format', description: 'The file format.', arguments: [{ name: 'format', required: true }] }],
                    },
                    { name: 'memory', description: 'What the agent remembers.', commands: [{ name: 'forget', description: 'Forget one memory.' }] },
                    { name: 'inspect', description: 'Internal.', hidden: true },
                ],
                keys: [{ keys: ['shift+enter', 'ctrl+j'], description: 'Start a new line.', context: 'composer' }],
            },
            'x-environment': [
                { name: 'ACME_AGENT_COLOR', description: 'The colours the UI draws with.', values: ['truecolor', 'none'] },
            ],
            commands: [{ name: 'resume', description: 'Continue a conversation in the UI.' }],
        },
    ],
};

const AGENT = {
    opencli: '1.0.0',
    info: { title: 'acme-agent', version: '0.3.0', description: 'Ask questions in a terminal UI.' },
    arguments: [{ name: 'prompt', description: 'A question to ask right away.' }],
    examples: ['acme-agent "Which pages are the slowest?"'],
    'x-interactive': { commands: [{ name: 'new', description: 'Start a new conversation.' }] },
    commands: [{ name: 'resume', description: 'Continue a conversation in the UI.' }],
};

describe('cliPageMarkdown', () => {
    let dir: string;
    const settings: any = {
        api: {
            cli: [
                { source: './acme.opencli.json', route: 'cli', options: { globalOptionsPerCommand: true } },
                { source: './acme-agent.opencli.json', route: 'agent-cli' },
            ],
        },
    };

    beforeAll(() => {
        dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cli-markdown-')));
        fs.writeFileSync(path.join(dir, 'acme.opencli.json'), JSON.stringify(ACME));
        fs.writeFileSync(path.join(dir, 'acme-agent.opencli.json'), JSON.stringify(AGENT));
    });

    afterAll(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    const page = (value: string) => cliPageMarkdown(value, settings, { cwd: dir });

    it('writes a runnable group with every section it renders', async () => {
        const md = await page('~/acme.opencli.json#agent');

        expect(md.startsWith('# agent \\[command\\]\n\nRun the agent CLI: every argument after `agent` is its own.\n\n')).toBe(true);
        expect(md).toContain('```shell\nacme agent [command] [options] [prompt]\n```');
        expect(md).toContain('## Arguments\n\n- `prompt` (string): A question to ask right away.');
        expect(md).toContain('## Options\n\n- `--model` (string): The model to answer with. (alias: -m)');
        expect(md).toContain('## Commands\n\n- `resume` (command): Continue a conversation in the UI.');
        // the page's global options, from the source's own options
        expect(md).toContain('## Global options\n\n- `--profile` (string): The profile to use.');
        // session commands are rows, their arguments, options and subcommands nested
        expect(md).toContain(
            '## Interactive commands\n\n' +
                '- `export` (command): Write the conversation to a file.\n' +
                '  - `path` (string, required): Where to write it.\n' +
                '  - `--format` (string): The file format.\n' +
                '- `memory` (command): What the agent remembers.\n' +
                '  - `forget` (command): Forget one memory.',
        );
        expect(md).not.toContain('inspect');
        expect(md).toContain('## Keys\n\n- `shift+enter, ctrl+j` (key): Start a new line. (context: composer)');
        expect(md).toContain(
            '## Environment\n\n- `ACME_AGENT_COLOR` (string): The colours the UI draws with. Examples: `truecolor`, `none`.',
        );
        expect(md).toContain('## Exit codes\n\n- `130` (integer): Interrupted.');
        // the generated invocation and the command's own examples, under one heading
        expect(md).toContain('## Examples\n\n```shell\nacme agent\n```\n\n```shell\nacme agent\nacme agent "Which pages are the slowest?"\n```\n');
        expect(md.match(/^## Examples$/gm)).toHaveLength(1);
        expect(md).not.toContain('--trace');
    });

    it('writes a subcommand with its inherited options and its nearest exit codes', async () => {
        const md = await page('~/acme.opencli.json#agent resume');

        expect(md.startsWith('# agent resume\n')).toBe(true);
        expect(md).toContain('## Inherited options\n\n- `--model` (string): The model to answer with. (alias: -m)');
        expect(md).toContain('## Exit codes\n\n- `130` (integer): Interrupted.');
    });

    it('keeps a group that needs a subcommand literal in its heading', async () => {
        const md = await page('~/acme.opencli.json#remote');

        expect(md.startsWith('# remote \\<command\\>\n')).toBe(true);
        expect(md).toContain('```shell\nacme remote <command>\n```');
        expect(md).toContain('## Exit codes\n\n- `0` (integer): Success.\n- `2` (integer): The service answered with an error.');
    });

    it('writes the root page of a CLI whose root documents a session', async () => {
        const md = await page('~/acme-agent.opencli.json#acme-agent');

        expect(md.startsWith('# acme-agent \\[command\\]\n\nAsk questions in a terminal UI.\n')).toBe(true);
        expect(md).toContain('## Interactive commands\n\n- `new` (command): Start a new conversation.');
        expect(md).toContain('acme-agent "Which pages are the slowest?"');
    });

    it('reads a relative source from the page\'s directory', async () => {
        const md = await cliPageMarkdown('../acme.opencli.json#remote list', settings, {
            cwd: dir,
            pageDir: path.join(dir, 'guides'),
        });

        expect(md.startsWith('# remote list\n\nList the remotes.\n')).toBe(true);
    });

    it('is empty for a value that names no command', async () => {
        expect(await page('~/acme.opencli.json')).toBe('');
        expect(await page('~/acme.opencli.json#nope')).toBe('');
    });
});

describe('cliReferenceMarkdown', () => {
    it('quotes a name that holds backticks and leaves a non-text description out', () => {
        const md = cliReferenceMarkdown({
            title: 'tick',
            canonical: 'tick',
            description: 'Prints `ticks`.',
            category: 'cli' as any,
            context: { fullPath: '' } as any,
            examples: { groups: [] },
            definitions: [
                {
                    title: 'Options',
                    properties: [
                        { name: 'a`b', type: 'string', description: { node: true } as any },
                        { name: 'hidden', type: 'string', description: '', meta: [{ name: 'internal', value: 'true' }] },
                    ],
                },
            ],
        });

        expect(md).toBe('# tick\n\nPrints `ticks`.\n\n## Options\n\n- ``a`b`` (string)\n');
    });
});
