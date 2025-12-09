import type { LoaderFunctionArgs } from 'react-router'

import type { EditorLoaderData } from './types'
import { organizationModel } from '~/models/organization'
import { githubService } from '~/services/github'
import { authServerService } from '~/services/auth.server'

const LOAD_BATCH_SIZE = 10
const MAX_FILES_TO_LOAD = 15

export async function loader({ request }: LoaderFunctionArgs): Promise<EditorLoaderData> {
    const url = new URL(request.url)
    const filePath = url.searchParams.get('file')

    // Get current user from session
    const currentUser = await authServerService.getCurentUserFromRequest(request)
    if (!currentUser) {
        throw new Error('User not authenticated')
    }

    // Get user's organizations
    const organizations = await organizationModel.findByUser(currentUser._id!)
    if (organizations.length === 0) {
        throw new Error('No organizations found for user')
    }

    // TODO: For now, use the first organization. In the future, you might want to allow users to select which organization to use
    const organization = organizations[0]

    if (!organization?.githubToken || !organization?.githubSettings) {
        throw new Error('GitHub not configured for this organization')
    }

    const { repoOrg, repo, repoBranch } = organization.githubSettings

    if (!repoOrg || !repo || !repoBranch) {
        throw new Error('Repository not selected in settings')
    }

    try {
        // Get repository tree
        const treeItems = await githubService.getRepositoryTree(
            organization.githubToken,
            repoOrg,
            repo,
            repoBranch
        )

        // Filter to get only files (not directories)
        const fileItems = treeItems.filter(item => item.type === 'blob')

        // Limit the number of files to load content for
        const filesToLoad = fileItems.slice(0, MAX_FILES_TO_LOAD)

        // Pre-load file contents (limited to MAX_FILES_TO_LOAD)
        const fileContents = new Map<string, string>()

        // Load files in parallel (limit to avoid overwhelming the API)
        for (let i = 0; i < filesToLoad.length; i += LOAD_BATCH_SIZE) {
            const batch = filesToLoad.slice(i, i + LOAD_BATCH_SIZE)
            const promises = batch.map(async (item) => {
                try {
                    const content = await githubService.getFileContent(
                        organization.githubToken!,
                        repoOrg!,
                        repo!,
                        item.path,
                        repoBranch!
                    )
                    fileContents.set(item.path, content)
                } catch (error) {
                    console.error(`Failed to load file ${item.path}:`, error)
                    // Set empty content for failed files
                    fileContents.set(item.path, '')
                }
            })

            await Promise.all(promises)
        }

        return {
            treeItems,
            fileContents,
            initialFile: filePath || undefined,
            totalFiles: fileItems.length,
            loadedFiles: filesToLoad.length,
            hasMoreFiles: fileItems.length > MAX_FILES_TO_LOAD
        }
    } catch (error) {
        console.error('Failed to load repository data:', error)
        throw new Error('Failed to load repository data')
    }
}
