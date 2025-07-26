import { cwd } from 'node:process'
import readline from 'node:readline'

import { cleanDirectory } from "./utils"

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


export async function askForClean(migratemeFlags: any) {
    const saveDir = migratemeFlags.dir || cwd();

    // Ask user if folder should be cleaned before processing
    const shouldClean = await askForConfirmation('Should the folder be cleaned before processing?');
    if (shouldClean) {
        await cleanDirectory(saveDir);
    }
}

export async function askForStart() {
    // Ask user if folder should be cleaned before processing
    const shouldStart = await askForConfirmation('Do you want to start the migration?');
    if (!shouldStart) {
        console.log('Migration cancelled')
        process.exit(0)
    }
}
