import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { isGitHubRepo, downloadGitHubRepo, askForConfirmation } from "./utils";
import { migration } from "./migration";


export async function migrateme(resource: string, migratemeFlags: any, globalFlags: any) {
    if (!resource || typeof resource !== 'string') {
        console.error('No resource provided')
        return
    }

    // Check if this is a GitHub raw URL pointing to a docs.json file
    if (isGitHubRepo(resource)) {
        // Ask user if folder should be cleaned before processing
        const shouldClean = await askForConfirmation('Should the folder be cleaned before processing?');
        
        if (shouldClean) {
            const saveDir = migratemeFlags.dir || cwd();
            await cleanDirectory(saveDir);
        }

        const extractDir = await downloadGitHubRepo(resource, migratemeFlags)

        await migration(extractDir)

        return
    }


    console.error("No support for this resource yet")
}

async function cleanDirectory(dirPath: string): Promise<void> {
    try {
        console.log('Cleaning folder before processing...');
        const files = await readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = join(dirPath, file.name);
            if (file.isDirectory()) {
                await rm(filePath, { recursive: true, force: true });
            } else {
                await rm(filePath, { force: true });
            }
        }
        console.log('Directory cleaned successfully');
    } catch (error) {
        console.warn('Warning: Could not clean directory:', error);
    }
}
