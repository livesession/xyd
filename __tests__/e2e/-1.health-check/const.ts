import {join} from "node:path"

export interface TestResult {
    nodeVersion: string
    packageManager: string
    testType: string
    testConfig: string
    success: boolean
    error?: string
}

export interface PageTest {
    path: string
}

export interface TestConfig {
    name: string
    templateDir: string
    pages: PageTest[]
}

export const NODE_VERSIONS = [
    '22',
    // '23',
    // '24'
]
// TODO: xyd-js version
export const PACKAGE_MANAGER = [
    // {name: 'npm', install: 'npm install -g @xyd-js/cli', use: 'xyd'},
    // { name: 'pnpm', install: 'pnpm add -g @xyd-js/cli', use: 'xyd' },
    {name: "bun", install: 'bun add -g @xyd-js/cli', use: 'xyd'},
    // { name: 'yarn', install: 'yarn global add @xyd-js/cli', use: 'xyd' }, // TODO: some issues
    // {name: 'npx', install: '', use: 'npx @xyd-js/cli'}
]

// Test configuration array - each entry defines a test scenario
export const TEST_CONFIGS: TestConfig[] = [
    {
        name: 'health-check',
        templateDir: join(process.cwd(), '__tests__/__fixtures__/health-check'),
        pages: [
            {path: '/introduction'},
        ],
    },
]

// Matrix of all Node.js versions and package managers
export const PACKAGE_MANAGER_NODE_MATRIX = NODE_VERSIONS.flatMap(version =>
    PACKAGE_MANAGER.map(pm => ({
        nodeVersion: version,
        packageManager: pm
    }))
)

