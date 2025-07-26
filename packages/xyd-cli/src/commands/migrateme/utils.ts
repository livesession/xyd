import {cwd} from 'node:process'
import {writeFile, mkdir, rm, readdir} from 'node:fs/promises'
import {isAbsolute, join, resolve} from 'node:path'
import {exec} from 'node:child_process'
import {promisify} from 'node:util'
import readline from 'node:readline'
import {homedir} from "node:os";

export function isURL(url: string) {
    return url.startsWith("http") || url.startsWith("https")
}

export function isGitHubRepo(url: string): boolean {
    // Check if URL matches pattern: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file}
    const githubRawPattern = /^https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/
    // Check if URL matches pattern: https://github.com/{owner}/{repo}
    const githubRepoPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/
    return githubRawPattern.test(url) || githubRepoPattern.test(url)
}

export function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; directory?: string } {
    // Check if it's a GitHub raw URL
    const rawUrlMatch = url.match(/^https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/)
    if (rawUrlMatch) {
        const [, owner, repo, branch, filePath] = rawUrlMatch
        return {owner, repo, branch, directory: filePath.split('/').slice(0, -1).join('/')}
    }

    // Check if it's a regular GitHub repository URL
    const repoUrlMatch = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/)
    if (!repoUrlMatch) {
        throw new Error('Invalid GitHub URL format')
    }

    const [, owner, repo] = repoUrlMatch

    // Extract branch and directory from the URL path
    const urlPath = url.replace(`https://github.com/${owner}/${repo}`, '')
    const pathParts = urlPath.split('/').filter(part => part.length > 0)

    let branch = 'main'
    let directory: string | undefined

    if (pathParts.length >= 2 && pathParts[0] === 'tree') {
        branch = pathParts[1]
        if (pathParts.length > 2) {
            directory = pathParts.slice(2).join('/')
        }
    } else if (pathParts.length >= 1) {
        // If no 'tree' in path, assume first part is branch
        branch = pathParts[0]
        if (pathParts.length > 1) {
            directory = pathParts.slice(1).join('/')
        }
    }

    return {owner, repo, branch, directory}
}

export async function downloadGitHubRepo(docsUrl: string, flags: any) {
    try {
        console.log('GitHub repo detected, downloading entire repository...')

        const {owner, repo, branch, directory} = parseGitHubUrl(docsUrl)
        const repoUrl = `https://github.com/${owner}/${repo}`
        const downloadUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`

        console.log(`Repository: ${repoUrl}`)
        console.log(`Branch: ${branch}`)
        if (directory) {
            console.log(`Directory: ${directory}`)
        }
        console.log(`Download URL: ${downloadUrl}`)

        // Download the repository as ZIP
        const response = await fetch(downloadUrl)
        if (!response.ok) {
            throw new Error(`Failed to download repository: ${response.statusText}`)
        }

        // Get the filename for the downloaded ZIP
        const filename = `${repo}-${branch}.zip`
        console.log(`Downloading ${filename}...`)

        // Determine the save directory
        const saveDir = flags.dir || cwd()
        const savePath = join(saveDir, filename)

        // Ensure the directory exists
        try {
            await mkdir(saveDir, {recursive: true})
        } catch (error) {
            // Directory might already exist, continue
        }

        // Save the file to disk
        const buffer = await response.arrayBuffer()
        await writeFile(savePath, Buffer.from(buffer))

        console.log(`Successfully downloaded repository: ${filename}`)
        console.log(`Saved to: ${savePath}`)

        // Extract the ZIP file
        console.log('Extracting ZIP file...')
        const extractDir = join(saveDir, `${repo}-${branch}`)

        // Remove existing directory if it exists
        try {
            await rm(extractDir, {recursive: true, force: true})
        } catch (error) {
            // Directory doesn't exist, continue
        }

        // Extract the ZIP file using system unzip command with flat structure
        const execAsync = promisify(exec)
        try {
            console.log('Starting extraction...')
            // Extract to a temporary directory first
            const tempExtractDir = join(saveDir, 'temp-extract')
            console.log(`Extracting to temp dir: ${tempExtractDir}`)

            await execAsync(`unzip -o -q "${savePath}" -d "${tempExtractDir}"`)
            console.log('ZIP extraction completed')

            // Find the actual repository directory (should be the only subdirectory)
            const tempFiles = await readdir(tempExtractDir, {withFileTypes: true})

            const repoDir = tempFiles.find(file => file.isDirectory())
            if (repoDir) {
                const sourceDir = join(tempExtractDir, repoDir.name)

                if (directory) {
                    // If a specific directory is requested, copy only that directory
                    const targetDir = join(sourceDir, directory)
                    console.log(`Moving files from ${targetDir} to ${saveDir}`)

                    // Check if the target directory exists
                    try {
                        await execAsync(`test -d "${targetDir}"`)
                    } catch (error) {
                        throw new Error(`Directory '${directory}' not found in repository`)
                    }

                    // Copy the specific directory contents to saveDir
                    await execAsync(`cp -r "${targetDir}"/* "${saveDir}/"`)
                    console.log(`Files from '${directory}' directory copied successfully`)
                } else {
                    // Copy all files and folders from the repo directory to saveDir
                    console.log(`Moving files from ${sourceDir} to ${saveDir}`)
                    await execAsync(`cp -r "${sourceDir}"/* "${saveDir}/"`)
                    console.log('Files copied successfully')
                }

                await rm(tempExtractDir, {recursive: true, force: true})
                console.log('Temp directory cleaned up')
            } else {
                throw new Error('Could not find repository directory in ZIP')
            }
        } catch (error) {
            console.error('Error during extraction:', error)
            // Fallback: try with tar if unzip is not available
            try {
                console.log('Trying tar fallback...')
                await execAsync(`tar -xf "${savePath}" --strip-components=1 -C "${saveDir}"`)
                console.log('Tar extraction completed')
            } catch (tarError) {
                console.warn('Could not extract ZIP file automatically. Please extract manually.')
                console.log(`ZIP file saved at: ${savePath}`)
                return saveDir
            }
        }

        // Remove the ZIP file after extraction
        await rm(savePath)

        console.log(`Successfully extracted to: ${saveDir}`)

        return saveDir
    } catch (error) {
        console.error('Error downloading repository:', error)
        throw error
    }
}

export function resolveResourcePath(resource: string): string {
    // Handle relative paths
    if (resource === '.' || resource === './') {
        return cwd();
    }

    // Handle home directory
    if (resource.startsWith('~/')) {
        return resolve(homedir(), resource.slice(2));
    }

    // Handle absolute paths
    if (isAbsolute(resource)) {
        return resource;
    }

    // Handle relative paths
    return resolve(cwd(), resource);
}

export async function cleanDirectory(dirPath: string): Promise<void> {
    try {
        console.log('Cleaning folder before processing...');
        const files = await readdir(dirPath, {withFileTypes: true});
        for (const file of files) {
            const filePath = join(dirPath, file.name);
            if (file.isDirectory()) {
                await rm(filePath, {recursive: true, force: true});
            } else {
                await rm(filePath, {force: true});
            }
        }
        console.log('Directory cleaned successfully');
    } catch (error) {
        console.warn('Warning: Could not clean directory:', error);
    }
}
