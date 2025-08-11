import { existsSync } from 'node:fs';

import { isGitHubRepo, downloadGitHubRepo, resolveResourcePath } from "./utils";
import { askForStart, askForClean } from "./cli";
import { migration } from "./migration";

export async function migrateme(resource: string, migratemeFlags: any, globalFlags: any) {
    if (!resource || typeof resource !== 'string') {
        console.error('No resource provided')
        return
    }

    // 1a. Check if this is a GitHub
    if (isGitHubRepo(resource)) {
        await askForClean(migratemeFlags)

        const extractDir = await downloadGitHubRepo(resource, migratemeFlags)
        await migration(extractDir)
        return
    }

    // 1b. Handle local paths
    const docsPath = resolveResourcePath(resource);

    if (existsSync(docsPath)) {
        await askForStart()

        await migration(docsPath);
        return;
    }

    console.error("No support for this resource yet")
}

