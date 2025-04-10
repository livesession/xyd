import path from 'node:path';
import { VFile } from 'vfile';

/**
 * Creates a mock AST tree with an @include statement
 */
export function createMockTree(includePath: string) {
    return {
        type: 'root',
        children: [
            {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        value: `@include "${includePath}"`
                    }
                ]
            }
        ]
    };
}

/**
 * Creates a VFile for testing
 */
export function createMockFile(dirname?: string) {
    return new VFile({
        path: 'test.md',
        value: '',
        dirname: dirname || path.resolve(__dirname, '../__fixtures__')
    });
}

/**
 * Creates a mock fetch function for testing external URLs
 */
export function createMockFetch(mockResponses: Record<string, string>) {
    const originalFetch = global.fetch;

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = input.toString();

        if (mockResponses[url]) {
            return {
                ok: true,
                text: async () => mockResponses[url]
            } as Response;
        }

        throw new Error(`Unexpected URL: ${url}`);
    }) as typeof fetch;

    return originalFetch;
}

/**
 * Restores the original fetch function
 */
export function restoreFetch(originalFetch: typeof global.fetch) {
    global.fetch = originalFetch;
} 