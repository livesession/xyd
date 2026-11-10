import path from 'node:path';

import { createXydServer, type XydServer } from './xyd-server';

/**
 * Before any suite (in CI, or with XYD_E2E_SMOKE=1): serve one minimal project
 * with the CLI under test. When even that fails — a release whose bundle cannot
 * build, a package that does not resolve — the whole run stops here with the
 * CLI's own error, in about a minute, instead of every suite failing on it in
 * turn. XYD_E2E_SMOKE=0 turns it off.
 */
export default async function globalSetup(): Promise<void> {
    const wanted = process.env.XYD_E2E_SMOKE ?? (process.env.CI ? '1' : '0');
    if (wanted !== '1') {
        return;
    }
    const project = path.resolve(__dirname, '../1.navigation/1.basic');
    const started = Date.now();
    let server: XydServer | undefined;
    try {
        server = await createXydServer(project);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`e2e smoke: the xyd CLI under test could not serve a minimal project (${project}); the run stops here.\n${reason}`);
    } finally {
        await server?.stop();
    }
    console.log(`e2e smoke: a minimal project served in ${Math.round((Date.now() - started) / 1000)}s`);
}
