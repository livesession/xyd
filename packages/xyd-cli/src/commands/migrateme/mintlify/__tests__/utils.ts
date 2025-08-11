import { execSync } from "node:child_process";
import { existsSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";

// Function to clone repository and handle monorepo cases
export async function cloneRepoIfNeeded(name: string, url: string, targetPath: string) {
    if (existsSync(targetPath)) {
        console.log(`Skipping ${name} - folder already exists at ${targetPath}`);
        return;
    }

    console.log(`Cloning ${name} from ${url} to ${targetPath}`);
    
    // Check if it's a monorepo (contains /tree/ in URL)
    if (url.includes('/tree/')) {
        // Extract the base repo URL and the subdirectory path
        const urlParts = url.split('/tree/');
        const baseRepoUrl = urlParts[0];
        const subPath = urlParts[1];
        
        // Clone the entire repository to a temporary location
        const tempPath = `${targetPath}_temp`;
        try {
            execSync(`git clone ${baseRepoUrl} ${tempPath}`, { stdio: 'inherit' });
            
            // Create the target directory
            execSync(`mkdir -p ${targetPath}`, { stdio: 'inherit' });
            
            // Check if the subPath exists in the cloned repository
            const fullSubPath = path.join(tempPath, subPath);
            if (!existsSync(fullSubPath)) {
                console.log(`Subpath ${subPath} not found in ${tempPath}. Available directories:`);
                const tempContents = readdirSync(tempPath);
                console.log(tempContents);
                
                // Try to find the correct branch name
                const branches = execSync(`cd ${tempPath} && git branch -r`, { encoding: 'utf8' });
                console.log('Available branches:', branches);
                
                // Try common branch names
                const commonBranches = ['main', 'master', 'develop'];
                for (const branch of commonBranches) {
                    const branchPath = path.join(tempPath, branch, 'docs');
                    if (existsSync(branchPath)) {
                        console.log(`Found docs in branch: ${branch}`);
                        execSync(`cp -r ${branchPath}/* ${targetPath}/`, { stdio: 'inherit' });
                        break;
                    }
                }
                
                // If still not found, try to find any docs directory
                const findDocs = execSync(`find ${tempPath} -name "docs" -type d`, { encoding: 'utf8' });
                if (findDocs.trim()) {
                    const docsPath = findDocs.trim().split('\n')[0];
                    console.log(`Found docs directory at: ${docsPath}`);
                    execSync(`cp -r ${docsPath}/* ${targetPath}/`, { stdio: 'inherit' });
                } else {
                    throw new Error(`Could not find docs directory in ${tempPath}`);
                }
            } else {
                // Copy only the docs subdirectory to the target
                execSync(`cp -r ${fullSubPath}/* ${targetPath}/`, { stdio: 'inherit' });
            }
            
            // Clean up temporary directory
            rmSync(tempPath, { recursive: true, force: true });
        } catch (error) {
            console.error(`Error cloning ${name}:`, error);
            // Clean up on error
            if (existsSync(tempPath)) {
                rmSync(tempPath, { recursive: true, force: true });
            }
            throw error;
        }
    } else {
        // Regular repository - clone directly
        try {
            execSync(`git clone ${url} ${targetPath}`, { stdio: 'inherit' });
        } catch (error) {
            console.error(`Error cloning ${name}:`, error);
            throw error;
        }
    }
}
