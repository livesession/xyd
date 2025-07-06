import { isGitHubRepo, downloadGitHubRepo } from "./utils";
import { migration } from "./migration";

export async function migrateme(resource: string, migratemeFlags: any, globalFlags: any) {
    if (!resource || typeof resource !== 'string') {
        console.error('No resource provided')
        return
    }

    // Check if this is a GitHub raw URL pointing to a docs.json file
    if (isGitHubRepo(resource)) {
        const extractDir = await downloadGitHubRepo(resource, migratemeFlags)

        await migration(extractDir)

        return
    }


    console.error("No support for this resource yet")
}
