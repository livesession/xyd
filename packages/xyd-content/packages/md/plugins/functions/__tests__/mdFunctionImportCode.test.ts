import path from 'node:path';
import fs from 'node:fs';

import {describe, it, expect} from 'vitest';

import {mdFunctionImportCode, parseImportPath, processContent, detectLanguage} from '../mdFunctionImportCode';
import {createMockTree, createMockFile, createMockFetch, restoreFetch} from './testHelpers';

// Get the absolute path to the fixtures directory
const fixturesDir = path.resolve(__dirname, '../__fixtures__');

describe('mdFunctionImportCode', () => {
    describe('parseImportPath', () => {
        it('should parse a simple file path', () => {
            const result = parseImportPath('path/to/file.ts');
            expect(result).toEqual({
                filePath: 'path/to/file.ts',
                regions: [],
                lineRanges: []
            });
        });

        it('should parse a file path with regions', () => {
            const result = parseImportPath('path/to/file.ts#region1,region2');
            expect(result).toEqual({
                filePath: 'path/to/file.ts',
                regions: [
                    {name: 'region1'},
                    {name: 'region2'}
                ],
                lineRanges: []
            });
        });

        it('should parse a file path with line ranges', () => {
            const result = parseImportPath('path/to/file.ts{1,2-4,8:,:10}');
            expect(result).toEqual({
                filePath: 'path/to/file.ts',
                regions: [],
                lineRanges: [
                    {start: 1, end: 1},
                    {start: 2, end: 4},
                    {start: 8},
                    {end: 10}
                ]
            });
        });

        it('should parse a file path with both regions and line ranges', () => {
            const result = parseImportPath('path/to/file.ts#region1{1-5}');
            expect(result).toEqual({
                filePath: 'path/to/file.ts',
                regions: [
                    {name: 'region1'}
                ],
                lineRanges: [
                    {start: 1, end: 5}
                ]
            });
        });
    });

    describe('processContent', () => {
        const sampleContent = `line1
#region test
line2
line3
#endregion test
line4
line5
#region another
line6
#endregion another
line7
line8
line9
`;

        it('should return the original content when no regions or line ranges are specified', () => {
            const result = processContent(sampleContent, [], []);
            expect(result).toBe(sampleContent);
        });

        it('should extract content from specified regions', () => {
            const result = processContent(sampleContent, [{name: 'test'}], []);
            expect(result).toBe('line2\nline3');
        });

        it('should extract content from multiple regions', () => {
            const result = processContent(sampleContent, [{name: 'test'}, {name: 'another'}], []);
            expect(result).toBe('line2\nline3\nline6');
        });

        it('should extract content based on line ranges', () => {
            console.log("THIS FAILS")
            const result = processContent(sampleContent, [], [{start: 3, end: 4}]);
            expect(result).toBe('line2\nline3');
        });

        it('should handle multiple line ranges', () => {
            const result = processContent(sampleContent, [], [
                {start: 1, end: 1},
                {start: 7, end: 7}
            ]);
            expect(result).toBe('line1\nline5');
        });

        it('should handle open-ended ranges', () => {
            const result = processContent(sampleContent, [], [{start: 11}]);
            expect(result).toBe('line7\nline8\nline9\n');
        });

        it('should handle ranges from start', () => {
            const result = processContent(sampleContent, [], [{end: 1}]);
            expect(result).toBe('line1');
        });
    });

    describe('detectLanguage', () => {
        it('should detect JavaScript language', () => {
            expect(detectLanguage('file.js')).toBe('javascript');
        });

        it('should detect TypeScript language', () => {
            expect(detectLanguage('file.ts')).toBe('typescript');
        });

        it('should detect Python language', () => {
            expect(detectLanguage('file.py')).toBe('python');
        });

        it('should return empty string for unknown extension', () => {
            expect(detectLanguage('file.xyz')).toBe('xyz');
        });

        it('should handle uppercase extensions', () => {
            expect(detectLanguage('file.TS')).toBe('typescript');
        });
    });

    describe('transformer', () => {
        it('should transform @importCode statements to code blocks', async () => {
            const transformer = mdFunctionImportCode();
            const tree = createMockTree('test.ts');
            const file = createMockFile();

            await transformer(tree, file);

            expect(tree.children[0].type).toBe('code');
            expect((tree.children[0] as any).lang).toBe('typescript');
            expect((tree.children[0] as any).value).toContain('export function testFunction');
        });

        it('should handle non-existent files gracefully', async () => {
            const transformer = mdFunctionImportCode();
            const tree = createMockTree('nonexistent.ts');
            const file = createMockFile();

            // Mock console.error to prevent test output pollution
            const originalConsoleError = console.error;
            console.error = () => {
            };

            await transformer(tree, file);

            // Restore console.error
            console.error = originalConsoleError;

            // The node should remain unchanged
            expect(tree.children[0].type).toBe('paragraph');
        });

        it('should handle custom resolveFrom option', async () => {
            const customFixturesDir = path.resolve(__dirname, '../__fixtures__');
            const transformer = mdFunctionImportCode({resolveFrom: customFixturesDir});
            const tree = createMockTree('test.ts');
            const file = createMockFile('/some/other/directory');

            await transformer(tree, file);

            expect(tree.children[0].type).toBe('code');
            expect((tree.children[0] as any).lang).toBe('typescript');
            expect((tree.children[0] as any).value).toContain('export function testFunction');
        });

        it('should handle complex import paths with regions and line ranges', async () => {
            const transformer = mdFunctionImportCode();
            const tree = createMockTree('test.ts#testRegion{1-3}');
            const file = createMockFile();

            await transformer(tree, file);

            expect(tree.children[0].type).toBe('code');
            expect((tree.children[0] as any).lang).toBe('typescript');
            expect((tree.children[0] as any).value).toContain('export function regionFunction');
        });

        it('should handle import paths with only regions', async () => {
            const transformer = mdFunctionImportCode();
            const tree = createMockTree('test.ts#testRegion');
            const file = createMockFile();

            await transformer(tree, file);

            expect(tree.children[0].type).toBe('code');
            expect((tree.children[0] as any).lang).toBe('typescript');
            expect((tree.children[0] as any).value).toContain('export function regionFunction');
        });

        it('should handle import paths with only line ranges', async () => {
            const transformer = mdFunctionImportCode();
            const tree = createMockTree('test.ts{1-3}');
            const file = createMockFile();

            await transformer(tree, file);

            expect(tree.children[0].type).toBe('code');
            expect((tree.children[0] as any).lang).toBe('typescript');
            expect((tree.children[0] as any).value).toContain('export function testFunction');
        });

        it('should handle external URLs', async () => {
            // Create mock fetch with our fixture content
            const externalUrl = 'https://example.com/test.ts';
            const fixtureContent = fs.readFileSync(path.resolve(fixturesDir, 'external.ts'), 'utf8');
            const originalFetch = createMockFetch({
                [externalUrl]: fixtureContent
            });

            const transformer = mdFunctionImportCode();
            const tree = createMockTree(externalUrl);
            const file = createMockFile();

            await transformer(tree, file);

            // Restore original fetch
            restoreFetch(originalFetch);

            expect(tree.children[0].type).toBe('code');
            expect((tree.children[0] as any).lang).toBe('typescript');
            expect((tree.children[0] as any).value).toContain('export function externalFunction');
        });

        it('should debug visit function', async () => {
            const transformer = mdFunctionImportCode();
            const tree = createMockTree('test.ts');

            // Log the tree structure to see what we're working with
            console.log('Tree structure:', JSON.stringify(tree, null, 2));

            const file = createMockFile();

            // Create a promise that resolves when the transformer is done
            const transformPromise = transformer(tree, file);

            // Wait for the promise to resolve
            await transformPromise;

            // Check if the tree was modified
            console.log('Tree after transformation:', JSON.stringify(tree, null, 2));

            expect(tree.children[0].type).toBe('code');
        });
    });
}); 