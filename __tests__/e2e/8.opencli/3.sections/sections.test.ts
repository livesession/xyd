import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { test, expect, type Page } from '@playwright/test';

import { createXydServerWithTemplate, type XydServer } from '../../utils/xyd-server';

// Every section a CLI reference page can carry, on the built pages, on both
// engines, at the site root and under `advanced.basename`. Two documents:
//
//   acme.opencli.json        a host CLI with an agent CLI mounted as `acme agent`
//                            (global options rendered on every page)
//   acme-agent.opencli.json  the agent CLI on its own: its root documents
//                            arguments, examples, a session and environment
//                            variables, so it gets a page of its own
//
// `acme agent` is a runnable group (arguments and options of its own, plus
// subcommands): its usage reads `[command]`, where `acme remote` reads
// `<command>`. Its session commands (`x-interactive`) are rows of its page,
// never pages or sidebar entries. Built in a fresh temporary workspace and
// served by the harness's static server (`npx serve`, clean URLs).
const FIXTURE = __dirname;

const ENGINES: { name: string; env: Record<string, string> }[] = [
    { name: 'bun', env: { XYD_BUN: '1' } },
    { name: 'vite', env: {} },
];

const BASES = ['', '/docs'];

// The sidebar of each route, in order: no session command among them.
const HOST_LINKS = ['login', 'remote', 'remote/add', 'remote/list', 'agent', 'agent/resume', 'agent/history', 'agent/history/list', 'agent/history/show'];
const AGENT_LINKS = ['acme-agent', 'resume', 'history', 'history/list', 'history/show', 'global-options'];
const SESSION_COMMANDS = ['new', 'model', 'export', 'memory', 'exit', 'inspect'];

/** A copy of the fixture whose docs.json mounts the site under `base`. */
function templateFor(base: string): { dir: string; cleanup: () => void } {
    if (!base) {
        return { dir: FIXTURE, cleanup: () => undefined };
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyd-cli-sections-'));
    for (const name of fs.readdirSync(FIXTURE)) {
        if (name.endsWith('.json')) {
            fs.copyFileSync(path.join(FIXTURE, name), path.join(dir, name));
        }
    }
    const docs = JSON.parse(fs.readFileSync(path.join(dir, 'docs.json'), 'utf8'));
    docs.advanced = { ...(docs.advanced || {}), basename: base };
    fs.writeFileSync(path.join(dir, 'docs.json'), JSON.stringify(docs, null, 2));

    return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

for (const engine of ENGINES) {
    for (const BASE of BASES) {
        test.describe(`opencli — every CLI page section (${engine.name} engine, ${BASE || 'no basename'})`, () => {
            test.describe.configure({ mode: 'serial' });

            let server: XydServer;
            let template: { dir: string; cleanup: () => void };

            test.beforeAll(async () => {
                template = templateFor(BASE);
                server = await createXydServerWithTemplate(template.dir, { mode: 'build', env: engine.env });
            });

            test.afterAll(async () => {
                await server?.stop();
                template?.cleanup();
            });

            async function get(urlPath: string) {
                const res = await fetch(server.getUrl(urlPath), { redirect: 'follow' });
                return { status: res.status, body: await res.text() };
            }

            async function open(page: Page, urlPath: string) {
                const resp = await page.goto(server.getUrl(`${BASE}${urlPath}`));
                expect(resp?.status() ?? 0, urlPath).toBeLessThan(400);
                await page.waitForLoadState('networkidle');
            }

            const sidebarLinks = (page: Page) => page.locator('aside[part="sidebar"] a[part="item-link"]');
            const sectionTitles = (page: Page) => page.locator('atlas-apiref-definitions h3');
            const section = (page: Page, title: string) =>
                page.locator('atlas-apiref-definitions > div', { has: page.locator('h3', { hasText: new RegExp(`^${title}$`) }) });
            const rowNames = (page: Page, title: string) =>
                section(page, title).locator(':scope > div > div > ul > li > atlas-apiref-prop > dl atlas-apiref-propname');
            const row = (page: Page, title: string, name: string) =>
                section(page, title).locator('li', { has: page.locator(`xpath=./atlas-apiref-prop/dl//atlas-apiref-propname[normalize-space()="${name}"]`) });

            test('a runnable group: [command] usage, every section in order, the examples', async ({ page }) => {
                await open(page, '/cli/agent');

                await expect(page.locator('h1').first()).toHaveText('agent [command]');
                await expect(page.locator('body')).toContainText('acme agent [command] [options] [prompt]');
                await expect(sectionTitles(page)).toHaveText([
                    'Arguments',
                    'Options',
                    'Commands',
                    'Global options',
                    'Interactive commands',
                    'Keys',
                    'Environment',
                    'Exit codes',
                ]);

                await expect(rowNames(page, 'Arguments')).toHaveText(['prompt']);
                await expect(rowNames(page, 'Options')).toHaveText(['--print', '--resume', '--model']);
                await expect(rowNames(page, 'Commands')).toHaveText(['resume', 'history']);
                await expect(rowNames(page, 'Global options')).toHaveText(['--profile', '--output']);
                await expect(rowNames(page, 'Keys')).toHaveText(['enter', 'shift+enter, ctrl+j', 'esc', 'ctrl+c']);
                await expect(row(page, 'Keys', 'enter')).toContainText('Send the question. (context: composer)');
                await expect(rowNames(page, 'Environment')).toHaveText(['ACME_AGENT_COLOR', 'ACME_AGENT_HOME']);
                await expect(row(page, 'Environment', 'ACME_AGENT_COLOR').locator('[part="examples-list"]')).toHaveText(/truecolor\s*256\s*16\s*none/);
                await expect(rowNames(page, 'Exit codes')).toHaveText(['0', '1', '2', '130']);
                await expect(row(page, 'Exit codes', '130')).toContainText('Interrupted.');

                // the generated invocation, then the command's own examples
                const samples = page.locator('atlas-apiref-samples');
                await expect(samples).toContainText('Examples');
                await expect(samples).toContainText('acme agent "Which pages are the slowest?"');
                await expect(samples).toContainText('acme agent -p "How many orders came in today?"');
            });

            test('session commands are rows with their arguments, options and subcommands nested', async ({ page }) => {
                await open(page, '/cli/agent');

                // the hidden one is left out
                await expect(rowNames(page, 'Interactive commands')).toHaveText(['new', 'model', 'export', 'memory', 'exit']);
                await expect(row(page, 'Interactive commands', 'exit')).toContainText('(alias: quit, q)');

                const exportRow = row(page, 'Interactive commands', 'export');
                const toggle = exportRow.locator('button[aria-expanded]').first();
                await expect(toggle).toHaveText('Show arguments and options');
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
                await toggle.click();
                await expect(toggle).toHaveText('Hide arguments and options');
                await expect(toggle).toHaveAttribute('aria-expanded', 'true');
                await expect(exportRow.locator('atlas-apiref-propname')).toHaveText(['export', 'path', '--format']);
                await expect(exportRow).toContainText('Where to write it.');

                await expect(row(page, 'Interactive commands', 'model').locator('button[aria-expanded]').first()).toHaveText('Show arguments');
                const memoryToggle = row(page, 'Interactive commands', 'memory').locator('button[aria-expanded]').first();
                await expect(memoryToggle).toHaveText('Show subcommands');
                await memoryToggle.click();
                await expect(row(page, 'Interactive commands', 'memory')).toContainText('Forget one memory.');
            });

            test('session commands get no page and no sidebar entry; the sidebar lists the commands', async ({ page }) => {
                await open(page, '/cli/agent');

                const hrefs = await sidebarLinks(page).evaluateAll((links) => links.map((a) => a.getAttribute('href')));
                const visible = hrefs.filter((href) => href?.startsWith(`${BASE}/cli/`));
                // the open group's links are rendered; every one is a command page
                for (const href of visible) {
                    expect(HOST_LINKS.map((p) => `${BASE}/cli/${p}`), href!).toContain(href);
                }
                for (const name of SESSION_COMMANDS) {
                    expect(hrefs.some((href) => href?.endsWith(`/agent/${name}`)), name).toBe(false);
                    expect((await get(`${BASE}/cli/agent/${name}`)).status, name).toBe(404);
                }
            });

            test('a subcommand: inherited options, the nearest exit codes, its own examples', async ({ page }) => {
                await open(page, '/cli/agent/resume');

                await expect(page.locator('h1').first()).toHaveText('agent resume');
                await expect(sectionTitles(page)).toHaveText(['Arguments', 'Inherited options', 'Global options', 'Exit codes']);
                await expect(rowNames(page, 'Inherited options')).toHaveText(['--model']);
                await expect(rowNames(page, 'Exit codes')).toHaveText(['0', '1', '2', '130']);
                await expect(page.locator('atlas-apiref-samples')).toContainText('acme agent resume 42');

                await open(page, '/cli/agent/history/show');
                await expect(sectionTitles(page)).toHaveText(['Arguments', 'Inherited options', 'Global options', 'Exit codes']);
                // its own exit codes win over its ancestors'
                await expect(rowNames(page, 'Exit codes')).toHaveText(['0', '4']);
            });

            test('a group that needs a subcommand reads <command>; a top-level command its environment and the root exit codes', async ({ page }) => {
                await open(page, '/cli/remote');
                await expect(page.locator('h1').first()).toHaveText('remote <command>');
                await expect(page.locator('body')).toContainText('acme remote <command>');

                await open(page, '/cli/agent/history');
                await expect(page.locator('h1').first()).toHaveText('agent history <command>');
                await expect(sectionTitles(page)).toHaveText(['Inherited options', 'Commands', 'Global options', 'Exit codes']);

                await open(page, '/cli/login');
                await expect(sectionTitles(page)).toHaveText(['Options', 'Global options', 'Environment', 'Exit codes']);
                await expect(rowNames(page, 'Environment')).toHaveText(['ACME_TOKEN']);
                await expect(row(page, 'Exit codes', '2')).toContainText('The service answered with an error.');
                await expect(page.locator('atlas-apiref-samples')).toContainText('acme login --token "$ACME_TOKEN"');
            });

            test('a CLI whose root documents a session gets a root page, first in its sidebar', async ({ page }) => {
                await open(page, '/agent-cli/acme-agent');

                await expect(page.locator('h1').first()).toHaveText('acme-agent [command]');
                await expect(page.locator('body')).toContainText('acme-agent [command] [options] [prompt]');
                await expect(page.locator('body')).toContainText('Ask questions in a terminal UI, or once with -p.');
                await expect(sectionTitles(page)).toHaveText([
                    'Arguments',
                    'Options',
                    'Commands',
                    'Interactive commands',
                    'Keys',
                    'Environment',
                    'Exit codes',
                ]);

                const hrefs = await sidebarLinks(page).evaluateAll((links) => links.map((a) => a.getAttribute('href')));
                const agentLinks = hrefs.filter((href) => href?.startsWith(`${BASE}/agent-cli/`));
                expect(agentLinks[0]).toBe(`${BASE}/agent-cli/acme-agent`);
                for (const href of agentLinks) {
                    expect(AGENT_LINKS.map((p) => `${BASE}/agent-cli/${p}`), href!).toContain(href);
                }
                await expect(page.locator('aside[part="sidebar"] [part="primary-item"][data-active="true"] [part="item-title"]')).toHaveText(
                    'acme-agent [command]',
                );
            });

            test('llms.txt links every command page and the root page, none of the session commands', async () => {
                const llms = await get(`${BASE}/llms.txt`);
                expect(llms.status).toBe(200);
                const links = [...llms.body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
                expect(links.sort()).toEqual(
                    [...HOST_LINKS.map((p) => `${BASE}/cli/${p}.md`), ...AGENT_LINKS.map((p) => `${BASE}/agent-cli/${p}.md`)].sort(),
                );
                expect(llms.body).toContain('[agent \\[command\\]]');
                expect(llms.body).toContain('[remote \\<command>]');
            });

            test('the .md twins carry the command: every section and the examples', async () => {
                const agent = await get(`${BASE}/cli/agent.md`);
                expect(agent.status).toBe(200);
                expect(agent.body).toMatch(/^cli: ['"]?~\/acme\.opencli\.json#agent['"]?$/m);
                expect(agent.body).toContain('# agent \\[command\\]');
                expect(agent.body).toContain('```shell\nacme agent [command] [options] [prompt]\n```');
                for (const heading of ['Arguments', 'Options', 'Commands', 'Global options', 'Interactive commands', 'Keys', 'Environment', 'Exit codes', 'Examples']) {
                    expect(agent.body, heading).toContain(`\n## ${heading}\n`);
                }
                expect(agent.body).toContain('- `export` (command): Write the conversation to a file.\n  - `path` (string, required): Where to write it.\n  - `--format` (string): The file format.');
                expect(agent.body).toContain('- `ACME_AGENT_COLOR` (string): The colours the UI draws with. Examples: `truecolor`, `256`, `16`, `none`.');
                expect(agent.body).toContain('- `130` (integer): Interrupted.');
                expect(agent.body).not.toContain('inspect');

                const resume = await get(`${BASE}/cli/agent/resume.md`);
                expect(resume.body).toContain('## Inherited options\n\n- `--model` (string)');

                const root = await get(`${BASE}/agent-cli/acme-agent.md`);
                expect(root.status).toBe(200);
                expect(root.body).toContain('# acme-agent \\[command\\]');
                expect(root.body).toContain('\n## Interactive commands\n');
            });
        });
    }
}
