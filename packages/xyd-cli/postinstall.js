import { execSync } from 'child_process';
import { existsSync } from 'fs';

const cliDir = '.cli';

if (existsSync(cliDir)) {
    try {
        execSync(`cd ${cliDir} && npm install`, { stdio: 'inherit' });
        console.log('Dependencies installed successfully in .cli directory.');
    } catch (error) {
        console.error('Failed to install dependencies in .cli directory:', error);
    }
} else {
    console.log('.cli directory does not exist. Skipping npm install.');
}