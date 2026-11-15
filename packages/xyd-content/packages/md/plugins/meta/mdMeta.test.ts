import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { VFile } from 'vfile';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getMetaComponent, registerMetaComponent } from '@xyd-js/context';

import { mdMeta } from './mdMeta';

// A page with a `cli` frontmatter renders the commands its value names. The
// value reaches the conversion whole: a comma-separated list (`#login,remote`)
// names every command in it, the way the page's `.md` twin reads it
// (cliPageMarkdown), in the string and in the object form.
const ACME = {
    opencli: '1.0.0',
    info: { title: 'acme', version: '1.0.0' },
    commands: [
        { name: 'login', description: 'Sign in.' },
        {
            name: 'remote',
            description: 'Manage remotes.',
            commands: [{ name: 'add', description: 'Add a remote.' }],
        },
        { name: 'status', description: 'Show the status.' },
    ],
};

describe('mdMeta: a cli frontmatter', () => {
    let dir: string;
    let cwd: string;
    let atlas: ReturnType<typeof getMetaComponent>;

    beforeAll(() => {
        dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'md-meta-cli-')));
        fs.mkdirSync(path.join(dir, 'guides'));
        fs.writeFileSync(path.join(dir, 'acme.opencli.json'), JSON.stringify(ACME));
        cwd = process.cwd();
        process.chdir(dir);
        atlas = getMetaComponent('atlas');
    });

    afterAll(() => {
        process.chdir(cwd);
        fs.rmSync(dir, { recursive: true, force: true });
        if (atlas) {
            registerMetaComponent(atlas.name, atlas.componentName, atlas.transform);
        }
    });

    /** The canonical of every reference the page's component gets for `frontmatter`. */
    async function rendered(frontmatter: string): Promise<string[]> {
        let references: any[] = [];
        registerMetaComponent('atlas', 'Atlas', (_theme, props) => {
            references = props.references || [];
            return {};
        });

        const file = new VFile({ path: path.join(dir, 'guides', 'page.md'), value: `---\n${frontmatter}\n---\n` });
        await mdMeta({} as any)()({ type: 'root', children: [] } as any, file as any);

        return references.map((reference) => reference.canonical);
    }

    it('renders the one command a value names', async () => {
        expect(await rendered('cli: ~/acme.opencli.json#login')).toEqual(['login']);
    });

    it('renders every command of a comma-separated list, not only the first', async () => {
        expect(await rendered('cli: ~/acme.opencli.json#login,remote')).toEqual(['login', 'remote']);
        expect(await rendered('cli: "~/acme.opencli.json#login, remote add"')).toEqual(['login', 'remote/add']);
    });

    it('reads a list in the object form the same way', async () => {
        expect(await rendered('cli:\n  path: ~/acme.opencli.json#login,remote')).toEqual(['login', 'remote']);
    });

    it('renders every command for a value without a region', async () => {
        expect(await rendered('cli: ~/acme.opencli.json')).toEqual(['login', 'remote', 'remote/add', 'status']);
    });
});
