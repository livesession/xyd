import {describe, it} from 'vitest';

import {testSourceReactRuntime} from './utils';

const tests: {
    name: string;
    description: string;
    propertyName?: string;
}[] = [
    // advanced/optional
    {
        name: '-1.vite-lib.custom-property',
        description: 'custom propertyName: injects __docs instead of __xydUniform',
        propertyName: '__docs',
    },
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
    {
        name: '-2.vite-lib.react-types-resilience',
        description: 'vite lib: components with React types in props do not break sibling components',
    },
    {
        name: '-3.vite-app.iframe-multi-entry',
        description: 'vite app: multi-entry with iframe loading separate React app',
    },
];

describe('xyd-source-react-runtime', () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testSourceReactRuntime(t.name, t.propertyName);
        }, 60_000);
    }
});
