import { cwd } from 'node:process'
import { writeFile, mkdir, rm, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import readline from 'node:readline'

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

export async function downloadGitHubRepo(docsUrl: string, flags: any) {
    try {
        console.log('GitHub repo detected, downloading entire repository...')

        let owner: string, repo: string, branch: string = 'main', filePath: string | undefined

        // Check if it's a GitHub raw URL
        const rawUrlMatch = docsUrl.match(/^https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)$/)
        if (rawUrlMatch) {
            [, owner, repo, branch, filePath] = rawUrlMatch
        } else {
            // Check if it's a regular GitHub repository URL
            const repoUrlMatch = docsUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/)
            if (!repoUrlMatch) {
                throw new Error('Invalid GitHub URL format')
            }
            [, owner, repo] = repoUrlMatch
        }
        const repoUrl = `https://github.com/${owner}/${repo}`
        const downloadUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`

        console.log(`Repository: ${repoUrl}`)
        console.log(`Branch: ${branch}`)
        if (filePath) {
            console.log(`File: ${filePath}`)
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
            await mkdir(saveDir, { recursive: true })
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
            await rm(extractDir, { recursive: true, force: true })
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
            const tempFiles = await readdir(tempExtractDir, { withFileTypes: true })

            const repoDir = tempFiles.find(file => file.isDirectory())
            if (repoDir) {
                const sourceDir = join(tempExtractDir, repoDir.name)
                console.log(`Moving files from ${sourceDir} to ${saveDir}`)

                // Copy all files and folders from the repo directory to saveDir
                await execAsync(`cp -r "${sourceDir}"/* "${saveDir}/"`)
                console.log('Files copied successfully')

                await rm(tempExtractDir, { recursive: true, force: true })
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

export async function askForConfirmation(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        // Add colors to make the question more visible
        const coloredQuestion = `\x1b[36m${question}\x1b[0m (y/n): `;

        rl.question(coloredQuestion, (answer) => {
            rl.close();
            const normalizedAnswer = answer.toLowerCase().trim();
            resolve(normalizedAnswer === 'y' || normalizedAnswer === 'yes');
        });
    });
}