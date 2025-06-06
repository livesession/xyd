import {describe, it, expect} from 'vitest';

import {parseFunctionCall} from '../utils';
import {FunctionName} from "../types";

describe('parseFunctionCall', () => {
    const testCases = [
        {
            name: '1a. should parse uniform with file path and options',
            input: `@uniform('~/path/to/resource.ts', {"mini": "Settings"})`,
            expected: ['~/path/to/resource.ts', {mini: 'Settings'}]
        },
        {
            name: '1b. should parse uniform with file path and options',
            input: `@uniform('~/path/to/resource.ts', {mini: 'Settings'})`,
            expected: ['~/path/to/resource.ts', {mini: 'Settings'}]
        },
        {
            name: '2. should parse uniform with file path only',
            input: '@uniform(~/path/to/resource.ts)',
            expected: ['~/path/to/resource.ts']
        },
        {
            name: '3a. should handle malformed uniform call',
            input: '@uniform_invalid()',
            expected: null
        },
        {
            name: '3b. should handle malformed uniform call',
            input: 'uniform()',
            expected: null
        }
    ];

    testCases.forEach(({name, input, expected}) => {
        it(name, () => {
            const node = {
                children: [{
                    type: 'text',
                    value: input
                }]
            };
            const result = parseFunctionCall(node, FunctionName.Uniform);
            expect(result).toEqual(expected);
        });
    });
});
