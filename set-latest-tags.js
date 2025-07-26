#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Script to set latest dist-tag for all packages by reading their package.json files
// Usage: node set-latest-tags-from-packages.js

// Registry configuration
const REGISTRY = 'http://localhost:4873';

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
        console.log(`Using registry: ${REGISTRY}`);
        console.log(`Found ${packages.length} packages`);
        console.log('');
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const package of packages) {
            console.log(`Setting latest tag for ${package.name}@${package.version}`);
            
            try {
                // Execute the npm dist-tag command
                const command = `sudo npm_config_registry=${REGISTRY} npm dist-tag add ${package.name}@${package.version} latest`;
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