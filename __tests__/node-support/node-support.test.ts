import {test, expect} from '@playwright/test'

import {PACKAGE_MANAGER_NODE_MATRIX, TestResult, TEST_CONFIGS, PACKAGE_MANAGER, NODE_VERSIONS} from './const'
import {
    setupWorkspace,
    testBuild,
    testDevServer,
    testBuiltPages,
    resultSummary,
    createTempWorkspace,
    cleanupTempWorkspace
} from './utilts'

test.describe.serial('CLI Node Support - Node.js and Package Manager Compatibility', () => {
    const testResults: TestResult[] = []
    const setupCompleted = new Set<string>()

    test.beforeAll(async () => {
        console.log('Starting CLI Node Support tests...')
    })

    test.afterAll(async () => {
        resultSummary(testResults)
        
        // Transform test results to baseline format
        const toolGroups = PACKAGE_MANAGER.map(pm => {
            const group: any[] = [];
            
            // Check if any tests pass for this package manager
            const allTestsPass = testResults.filter(result =>
                result.packageManager === pm.name
            ).every(result => result.success);
            
            // Always add package manager entry, but only if supported
            if (allTestsPass) {
                group.push({ tool: pm.name, supported: true });
                
                // Add Node.js versions for this package manager
                NODE_VERSIONS.forEach(nodeVersion => {
                    // Check if test pass for this combination
                    const testPass = testResults.find(result => 
                        result.nodeVersion === nodeVersion && 
                        result.packageManager === pm.name &&
                        result.success
                    );

                    if (!testPass) {
                        return;
                    }
                    
                    group.push({
                        tool: 'node',
                        supported: true,
                        label: nodeVersion
                    });
                });
            }
            // If not supported, group remains empty []
            
            return group;
        });
        
        // Save baseline data to JSON file
        const fs = require('fs');
        const resultsPath = 'test-results.json';
        fs.writeFileSync(resultsPath, JSON.stringify(toolGroups, null, 2));
        console.log(`📊 Baseline data saved to ${resultsPath}`);
        console.log('📊 Generated tool groups:', JSON.stringify(toolGroups, null, 2));
    })

    // Set timeout for all tests in this describe block to 10 minutes
    test.setTimeout(10 * 60 * 1000)

    // Helper function to ensure setup is done only once per matrix combination
    async function ensureSetup(nodeVersion: string, pm: any) {
        const setupKey = `${nodeVersion}-${pm.name}`
        if (!setupCompleted.has(setupKey)) {
            console.log(`\n🔧 Setting up environment for Node ${nodeVersion} and ${pm.name}...`)
            await setupWorkspace(nodeVersion, pm)
            setupCompleted.add(setupKey)
            console.log(`✅ Setup completed for Node ${nodeVersion} and ${pm.name}`)
        }
    }

    test.describe('Phase 1: Dev Server Tests', () => {
        // Dev server tests - all must complete before moving to build tests
        for (const {nodeVersion, packageManager: pm} of PACKAGE_MANAGER_NODE_MATRIX) {
            for (const testConfig of TEST_CONFIGS) {
                test(`should run dev server with Node ${nodeVersion} and ${pm.name} for ${testConfig.name}`, async () => {
                    const tempDir = createTempWorkspace(testConfig)
                    const result: TestResult = {
                        nodeVersion,
                        packageManager: pm.name,
                        testType: 'dev',
                        testConfig: testConfig.name,
                        success: false
                    }

                    try {
                        console.log(`\n--- Testing DEV SERVER with Node ${nodeVersion} and ${pm.name} for ${testConfig.name} ---`)

                        // Ensure setup is done once per matrix combination
                        await ensureSetup(nodeVersion, pm)

                        const devSuccess = await testDevServer(pm, testConfig, tempDir)
                        expect(devSuccess).toBe(true)

                        result.success = true
                        console.log(`✅ Dev server works with ${pm.name} for ${testConfig.name}`)
                    } catch (err) {
                        result.error = err instanceof Error ? err.message : String(err)
                        console.error(`❌ Dev server failed with Node ${nodeVersion} and ${pm.name} for ${testConfig.name}:`, result.error)
                        throw err
                    } finally {
                        testResults.push(result)
                        cleanupTempWorkspace(tempDir)
                    }
                })
            }
        }
    })

    test.describe('Phase 2: Build and Serve Tests', () => {
        // Combined build and serve tests - using same Node.js versions and package managers as dev tests
        for (const {nodeVersion, packageManager: pm} of PACKAGE_MANAGER_NODE_MATRIX) {
            for (const testConfig of TEST_CONFIGS) {
                test(`should build and serve with Node ${nodeVersion} and ${pm.name} for ${testConfig.name}`, async () => {
                    const tempDir = createTempWorkspace(testConfig)
                    const result: TestResult = {
                        nodeVersion,
                        packageManager: pm.name,
                        testType: 'build-and-serve',
                        testConfig: testConfig.name,
                        success: false
                    }

                    try {
                        console.log(`\n--- Testing BUILD AND SERVE with Node ${nodeVersion} and ${pm.name} for ${testConfig.name} ---`)

                        // Reuse the same setup that was done for dev tests
                        await ensureSetup(nodeVersion, pm)

                        // Step 1: Build the project and check if client directory exists
                        const buildSuccess = await testBuild(pm, testConfig, tempDir)
                        expect(buildSuccess).toBe(true)
                        console.log(`✅ Build successful - client directory exists`)

                        // Step 2: Serve built pages and check page status codes
                        const serveSuccess = await testBuiltPages(pm, testConfig, tempDir)
                        expect(serveSuccess).toBe(true)
                        console.log(`✅ Serve successful - all pages return good status`)

                        result.success = true
                        console.log(`✅ Build and serve works with ${pm.name} for ${testConfig.name}`)
                    } catch (err) {
                        result.error = err instanceof Error ? err.message : String(err)
                        console.error(`❌ Build and serve failed with Node ${nodeVersion} and ${pm.name} for ${testConfig.name}:`, result.error)
                        throw err
                    } finally {
                        testResults.push(result)
                        cleanupTempWorkspace(tempDir)
                    }
                })
            }
        }
    })
})
