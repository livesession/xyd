import fs from 'node:fs';

import { preWorkspaceSetup, postWorkspaceSetup, getHostPath } from './utils';
// import { readSettings } from './settings';
import { readSettings } from '@xyd-js/plugin-docs';

export async function install() {
    const settings = await readSettings() // TODO: in the future better solution - currently we load settings twice (pluginDocs and here)
    if (!settings) {
        throw new Error("cannot preload settings")
    }
    if (typeof settings === "string") {
        throw new Error("install does not support string settings")
    }

    // Clear the host folder if it exists
    const hostPath = getHostPath();
    if (fs.existsSync(hostPath)) {
        fs.rmSync(hostPath, { recursive: true, force: true });
    }

    // Run pre-workspace setup
    await preWorkspaceSetup({
        force: true,
    });

    // Run post-workspace setup with empty settings
    // The actual settings will be loaded during the build/dev process
    await postWorkspaceSetup(settings);
}