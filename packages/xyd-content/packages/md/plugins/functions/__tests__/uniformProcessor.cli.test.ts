import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VFile } from 'vfile';

import { processUniformFunctionCall } from '../uniformProcessor';

// The page step of a generated CLI reference page: the CLI preset writes the
// page with `cli: ~/<source>#<command>` frontmatter into the generated content
// folder, and the uniform processor converts the command from the OpenCLI
// document. The page has to be converted with the options of its `api.cli`
// entry, the same ones its navigation was built with.
const ACME = {
    opencli: '1.0.0',
    info: { title: 'acme', version: '1.0.0' },
    options: [
        { name: 'profile', recursive: true, description: 'The configuration profile to use.', arguments: [{ name: 'name', required: true }] },
        { name: 'verbose', recursive: true, description: 'Print more output.' },
        { name: 'internal', recursive: true, hidden: true },
    ],
    commands: [
        { name: 'init', description: 'Create a new acme project.' },
        { name: 'deploy', description: 'Deploy the current project.', options: [{ name: 'dry-run' }] },
    ],
};

describe('uniform processor: a generated CLI page', () => {
    let dir: string;
    let prevCwd: string;

    beforeAll(() => {
        prevCwd = process.cwd();
        dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cli-page-')));
        fs.writeFileSync(path.join(dir, 'acme.opencli.json'), JSON.stringify(ACME));
        process.chdir(dir);
    });

    afterAll(() => {
        process.chdir(prevCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    // A page as the preset writes it: in the generated content folder, its
    // source relative to the docs root (not to the page's own directory).
    function convert(command: string, settings: any) {
        const value = `~/acme.opencli.json#${command}`;
        const file = new VFile({ path: path.join(dir, '.xyd/.cache/.content/cli', `${command}.md`), value: '' });
        file.data.matter = { cli: value };
        return processUniformFunctionCall(value, file, undefined, settings);
    }

    const globalsOf = (ref: any) =>
        ref.definitions.find((d: any) => d.title === 'Global options')?.properties.map((p: any) => p.name);

    it('puts the global options on every command with globalOptionsPerCommand', async () => {
        const settings = { api: { cli: [{ source: './acme.opencli.json', route: 'cli', options: { globalOptionsPerCommand: true } }] } };
        for (const command of ['init', 'deploy']) {
            const refs = await convert(command, settings);
            expect(refs?.map((r) => r.title)).toEqual([command]);
            expect(globalsOf(refs![0])).toEqual(['--profile', '--verbose']);
        }
    });

    it('keeps them off the command pages by default (they get a page of their own)', async () => {
        for (const settings of [
            { api: { cli: [{ source: './acme.opencli.json', route: 'cli' }] } },
            { api: { cli: [{ source: './acme.opencli.json', route: 'cli', options: { globalOptionsPerCommand: false } }] } },
            { api: { cli: './acme.opencli.json' } },
        ]) {
            const refs = await convert('init', settings);
            expect(refs?.map((r) => r.title)).toEqual(['init']);
            expect(globalsOf(refs![0])).toBeUndefined();
        }
    });
});
