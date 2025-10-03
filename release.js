#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if --prod flag is provided
const isProduction = process.argv.includes('--prod');
const setLatestTags = process.argv.includes('--set-latest-tags');
const noPublish = process.argv.includes('--no-publish');
// const snapshot = process.argv.includes('--snapshot');
const snapshotIndex = process.argv.indexOf('--snapshot');
const snapshot = snapshotIndex !== -1 ? process.argv[snapshotIndex + 1] : false;

// Helper function to run commands
function runCommand(command, description) {
    console.log(`\n🔄 ${description}...\n`);
    try {
        const [cmd, ...args] = command.split(' ');
        const result = spawnSync(cmd, args, {
            stdio: 'inherit',
            shell: true
        });

        if (result.status !== 0) {
            throw new Error(`Command failed with exit code ${result.status}`);
        }
        console.log(`✅ ${description} completed successfully`);
    } catch (error) {
        console.error(`❌ Error during ${description}:`, error.message);
        process.exit(1);
    }
}

// Helper function to create changeset file
function createChangeset(packages, message) {
    const changesetDir = '.changeset';
    const timestamp = Date.now();
    const filename = `release-${timestamp}.md`;
    // const filename = 'trigger-patch-for-build-release.md';

    const filepath = path.join(changesetDir, filename);

    let content = '---\n';
    packages.forEach(pkg => {
        content += `"${pkg}": patch\n`;
    });
    content += '---\n\n';
    content += message;

    fs.writeFileSync(filepath, content);
    console.log(`✅ Created changeset: ${filename}\n`);
}

async function main() {
    console.log('🚀 Starting release process...\n');

    // Step 1: Build
    // runCommand('pnpm run build', 'Building packages');

    {
        // Step 2: Changeset for all CLI dependencies packages
        console.log('🔄 Creating changeset for CLI dependencies packages...');
        createChangeset([
            '@xyd-js/openapi-sampler',
            '@xyd-js/analytics',
            '@xyd-js/atlas',
            '@xyd-js/components',
            '@xyd-js/composer',
            '@xyd-js/content',
            '@xyd-js/context',
            '@xyd-js/core',
            '@xyd-js/documan',
            '@xyd-js/foo',
            '@xyd-js/framework',
            '@xyd-js/gql',
            '@xyd-js/host',
            '@xyd-js/openapi',
            '@xyd-js/plugin-algolia',
            '@xyd-js/plugin-docs',
            '@xyd-js/plugin-orama',
            '@xyd-js/plugin-chatwoot',
            '@xyd-js/plugin-intercom',
            '@xyd-js/plugin-livechat',
            '@xyd-js/plugin-supademo',
            '@xyd-js/plugins',
            '@xyd-js/sources',
            '@xyd-js/storybook',
            '@xyd-js/theme-cosmo',
            '@xyd-js/theme-gusto',
            '@xyd-js/theme-opener',
            '@xyd-js/theme-picasso',
            '@xyd-js/theme-poetry',
            '@xyd-js/theme-solar',
            '@xyd-js/themes',
            '@xyd-js/ui',
            '@xyd-js/uniform',
            '@xyd-js/cli',
            '@xyd-js/mcp',
            '@xyd-js/mcp-server',
            '@xyd-js/ask-ai',
            '@xyd-js/ask-ai-edge',
        ], 'update all packages');

        // Step 3: Clear npm cache
        runCommand('rm -rf $HOME/.npm/_cacache', 'Clearing npm cache');

        // Step 4: Update all CLI dependencies packages versions
        if (snapshot) {
            runCommand(`pnpm changeset version --snapshot ${snapshot}`, 'Versioning CLI dependencies packages');
        } else {
            runCommand('pnpm changeset version', 'Versioning CLI dependencies packages');
        }

        // Step 5: Publish all CLI dependencies packages
        if (!noPublish) {
            const publishCommand = isProduction
                ? 'pnpm changeset publish'
                : 'npm_config_registry=http://localhost:4873 pnpm changeset publish';
            runCommand(publishCommand, 'Publishing packages');
        }
    }

    if (!noPublish && (!isProduction || setLatestTags)) {
        // TODO: FIX IN THE FUTURE CUZ IT SHOULD BE AUTOMATICALLY DONE BY NPM
        // set latest tags
        runCommand(`node set-latest-tags.js ${isProduction ? '--prod' : ''}`, 'Setting latest tags');
    }

    console.log('🎉 Release process completed successfully!\n');
}

main().catch(error => {
    console.error('❌ Release process failed:', error);
    process.exit(1);
});