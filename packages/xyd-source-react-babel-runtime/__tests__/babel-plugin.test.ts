import {describe, it} from 'vitest';

import {testBabelRuntimePlugin} from './utils';

const tests: {
    name: string;
    description: string;
}[] = [
    {
        name: '1.user-card',
        description: 'Basic React component with typed props',
    },
    {
        name: '2.sample-app',
        description: 'Sample app with typed props, contexts.',
    },
    {
        name: '3.sample-real-app',
        description: 'Real Vite todo app with tailwind, contexts, hooks, multi-file components.',
    },
];

describe('xyd-source-react-babel-runtime', () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testBabelRuntimePlugin(t.name);
        }, 60_000);
    }
});
