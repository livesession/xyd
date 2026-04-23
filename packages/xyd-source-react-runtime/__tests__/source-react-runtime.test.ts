import {describe, it} from 'vitest';

import {testSourceReactRuntime} from './utils';

const tests: {
    name: string;
    description: string;
}[] = [
    // vite-lib
    {
        name: '1.vite-lib.user-card',
        description: 'vite lib: basic component with inline props',
    },
    {
        name: '2.vite-lib.sample-app',
        description: 'vite lib: cross-file types with contexts',
    },
    {
        name: '3.vite-lib.sample-real-app',
        description: 'vite lib: real todo app with multiple components',
    },
    // vite-app
    {
        name: '4.vite-app.user-card',
        description: 'vite app: basic component with automatic JSX runtime',
    },
    // rollup
    {
        name: '5.rollup.user-card',
        description: 'rollup: basic component with @rollup/plugin-typescript',
    },
    // esbuild
    {
        name: '6.esbuild.user-card',
        description: 'esbuild: basic component with esbuild loader',
    },
    // real framework apps
    {
        name: '7.react-router.app',
        description: 'react-router v7: real framework mode with routes, Link, useParams',
    },
    {
        name: '8.tanstack-router.app',
        description: 'tanstack router: file-based routing with createFileRoute, Link, useNavigate',
    },
];

describe('xyd-source-react-runtime', () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testSourceReactRuntime(t.name);
        }, 60_000);
    }
});
