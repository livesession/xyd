import path from 'node:path';
import {VFile} from 'vfile';

export function importCodeMockTree(importPath: string) {
    return {
        type: 'root',
        children: [
            {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        value: `@importCode "${importPath}"`
                    }
                ]
            }
        ]
    };
}

export function importCodeMdAttributesMockTree(
    importPath: string,
    attributes: Record<string, string>
) {
    // Convert attributes object to md attribute string
    const attrsString = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');

    return {
        type: 'root',
        children: [
            {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        value: `@importCode[${attrsString}] "${importPath}"`
                    }
                ]
            }
        ]
    };
}

export function importCodeMockTreeAlternative(importPath: string) {
    return {
        type: 'root',
        children: [
            {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        value: `@importCode("${importPath}")`
                    }
                ]
            }
        ]
    };
}


export function createMockFile(dirname?: string) {
    return new VFile({
        path: 'test.md',
        value: '',
        dirname: dirname || path.resolve(__dirname, '../__fixtures__')
    });
}


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


export function restoreFetch(originalFetch: typeof global.fetch) {
    global.fetch = originalFetch;
}
