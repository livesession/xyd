#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Script to set latest dist-tag for all packages by reading their package.json files
// Usage: node set-latest-tags-from-packages.js

// Registry configuration

const isProduction = process.argv.includes('--prod');
const tokenIndex = process.argv.indexOf('--token');
let npmToken = null;

// Handle both --token value and --token=value formats
if (tokenIndex !== -1) {
    const tokenArg = process.argv[tokenIndex];
    if (tokenArg.includes('=')) {
        // Format: --token=value
        npmToken = tokenArg.split('=')[1];
    } else {
        // Format: --token value
        npmToken = process.argv[tokenIndex + 1];
    }
}

const REGISTRY = isProduction ? 'https://registry.npmjs.org' : 'http://localhost:4873';

function authenticateWithToken() {
    if (npmToken) {
        console.log('🔐 Using npm token for authentication...');
        try {
            // Set the token in npm config
            const loginCommand = `npm config set //registry.npmjs.org/:_authToken=${npmToken}`;
            execSync(loginCommand, { stdio: 'inherit' });
            
            // Also set the registry to ensure we're using the right one
            const registryCommand = `npm config set registry ${REGISTRY}`;
            execSync(registryCommand, { stdio: 'inherit' });
            
            console.log('✅ Authenticated using npm token');
        } catch (error) {
            console.error('❌ Failed to authenticate with token:', error.message);
            process.exit(1);
        }
    }
}

function getPackagesFromDirectory() {
    const packagesDir = path.join(__dirname, 'packages');
    const packages = [];
    
    try {
        const packageDirs = fs.readdirSync(packagesDir);
        
        for (const dir of packageDirs) {
            const packageJsonPath = path.join(packagesDir, dir, 'package.json');
            
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    const packageName = packageJson.name;
                    const version = packageJson.version;
                    
                    if (packageName && version) {
                        packages.push({ name: packageName, version });
                    }
                } catch (error) {
                    console.log(`⚠️  Error reading package.json in ${dir}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error('Error reading packages directory:', error.message);
    }
    
    return packages;
}

function setLatestTags() {
    try {
        const packages = getPackagesFromDirectory();
        
        console.log('Setting latest dist-tags for all packages...');
        console.log(`Using registry: ${isProduction ? 'https://registry.npmjs.org' : REGISTRY}`);
        console.log(`Found ${packages.length} packages`);
        console.log('');
        
        // Authenticate with token if provided
        authenticateWithToken();
        console.log('');
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const package of packages) {
            console.log(`Setting latest tag for ${package.name}@${package.version}`);
            
            try {
                // Execute the npm dist-tag command with environment variables
                const envVars = npmToken 
                    ? `NPM_TOKEN=${npmToken} npm_config_registry=${REGISTRY}`
                    : `npm_config_registry=${REGISTRY}`;
                const command = `${envVars} npm dist-tag add ${package.name}@${package.version} latest`;
                execSync(command, { stdio: 'inherit' });
                
                console.log(`✅ Successfully set latest tag for ${package.name}@${package.version}`);
                successCount++;
            } catch (error) {
                console.log(`❌ Failed to set latest tag for ${package.name}@${package.version}`);
                console.log(`   Error: ${error.message}`);
                failureCount++;
            }
            
            console.log('');
        }
        
        console.log('=== Summary ===');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failureCount}`);
        console.log(`📦 Total packages processed: ${packages.length}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
setLatestTags(); 