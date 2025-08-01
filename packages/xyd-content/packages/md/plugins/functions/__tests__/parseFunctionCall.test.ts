import {describe, it, expect} from 'vitest';

import {parseFunctionCall} from '../utils';
import {FunctionName} from "../types";

describe('parseFunctionCall', () => {
    const testCases = [
        {
            name: '1a. should parse uniform with file path and options',
            function: FunctionName.Uniform,
            input: `@uniform('~/path/to/resource.ts', {"mini": "Settings"})`,
            expected: ['~/path/to/resource.ts', {mini: 'Settings'}]
        },
        {
            name: '1b. should parse uniform with file path and options',
            function: FunctionName.Uniform,
            input: `@uniform('~/path/to/resource.ts', {mini: 'Settings'})`,
            expected: ['~/path/to/resource.ts', {mini: 'Settings'}]
        },
        {
            name: '2. should parse uniform with file path only',
            function: FunctionName.Uniform,
            input: '@uniform(~/path/to/resource.ts)',
            expected: ['~/path/to/resource.ts']
        },
        {
            name: '3a. should handle malformed uniform call',
            function: FunctionName.Uniform,
            input: '@uniform_invalid()',
            expected: null
        },
        {
            name: '3b. should handle malformed uniform call',
            function: FunctionName.Uniform,
            input: 'uniform()',
            expected: null
        },
        {
            name: '4. should parse function with md attributes',
            function: FunctionName.ImportCode,
            input: `@importCode[descHead="Tip" desc="It's a nice code"] ~/path/to/resource.ts`,
            expected: ['~/path/to/resource.ts', {__mdAttrs: {descHead: 'Tip', desc: "It's a nice code"}}]
        },
        {
            name: '4. should parse function with md attributes + quotes',
            function: FunctionName.ImportCode,
            input: `@importCode[descHead="Tip" desc="You can use md attributes!"] "~/path/to/resource.ts"`,
            expected: ['~/path/to/resource.ts', {__mdAttrs: {descHead: 'Tip', desc: "You can use md attributes!"}}]
        },
        {
            name: '4. should parse function with md attributes + shortand attrs',
            function: FunctionName.ImportCode,
            input: `@importCode[!scroll lines descHead="Tip" desc="You can use md attributes!"] "~/path/to/resource.ts"`,
            expected: ['~/path/to/resource.ts', {__mdAttrs: {scroll: "false", lines: "true", descHead: 'Tip', desc: "You can use md attributes!"}}]
        }
    ];

    testCases.forEach(({name, function: functionName, input, expected}) => {
        it(name, () => {
            const node = {
                children: [{
                    type: 'text',
                    value: input
                }]
            };
            const result = parseFunctionCall(node, functionName);
            expect(result).toEqual(expected);
        });
    });
});
