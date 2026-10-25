import { describe, it, expect } from 'vitest';

import { resolveApiFileOptions } from './apiFileOptions';

const ABS = '/site/specs/widgets.yaml';

describe('resolveApiFileOptions', () => {
    it('returns null without an api, a source, or an advanced entry', () => {
        expect(resolveApiFileOptions(undefined, ABS)).toBeNull();
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml', options: { objectsGroup: 'Types' } }, '')).toBeNull();
        expect(resolveApiFileOptions('./specs/widgets.yaml', ABS)).toBeNull();
        expect(resolveApiFileOptions(['./specs/widgets.yaml'], './specs/widgets.yaml')).toBeNull();
    });

    it('matches the verbatim config source and the absolute path of that file', () => {
        const api = { source: './specs/widgets.yaml', options: { objectsGroup: 'Types' } };
        expect(resolveApiFileOptions(api, './specs/widgets.yaml')?.objectsGroup).toBe('Types');
        expect(resolveApiFileOptions(api, ABS)?.objectsGroup).toBe('Types');
        expect(resolveApiFileOptions(api, 'C:\\site\\specs\\widgets.yaml')?.objectsGroup).toBe('Types');
        expect(resolveApiFileOptions(api, '/site/specs/other.yaml')).toBeNull();
        expect(resolveApiFileOptions(api, '/site/specs/notwidgets.yaml')).toBeNull();
    });

    it('walks the array and map shapes; the first matching entry wins', () => {
        const list = [
            './specs/other.yaml',
            { source: './specs/widgets.yaml', options: { objectsGroup: 'Types' } },
            { source: 'specs/widgets.yaml', options: { objectsGroup: 'Second' } },
        ];
        expect(resolveApiFileOptions(list, ABS)?.objectsGroup).toBe('Types');
        expect(resolveApiFileOptions(list, '/site/specs/other.yaml')).toBeNull();

        const map = {
            a: './specs/other.yaml',
            b: { source: '../specs/widgets.yaml', options: { objectsGroup: 'Mapped' } },
        };
        expect(resolveApiFileOptions(map, ABS)?.objectsGroup).toBe('Mapped');
    });

    it('returns every option of the matching entry, the objects layout and the page-path mode included', () => {
        const api = { source: './specs/widgets.yaml', options: { objectsGroup: 'Types', objectsLayout: 'per-area' as const, operationPaths: 'title' as const } };
        expect(resolveApiFileOptions(api, ABS)).toEqual({ objectsGroup: 'Types', objectsLayout: 'per-area', operationPaths: 'title' });
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml', options: { objectsLayout: 'grouped' } }, ABS)?.objectsLayout).toBe('grouped');
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml', options: { operationPaths: 'operation-id' } }, ABS)?.operationPaths).toBe('operation-id');
    });

    it('returns null for a matching entry without options', () => {
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml' }, ABS)).toBeNull();
        expect(resolveApiFileOptions([{ source: './specs/widgets.yaml' }, { source: 'specs/widgets.yaml', options: { objectsGroup: 'Later' } }], ABS)).toBeNull();
    });

    it('matches remote sources by exact equality only', () => {
        const api = { source: 'https://example.com/specs/widgets.yaml', options: { objectsGroup: 'Remote' } };
        expect(resolveApiFileOptions(api, 'https://example.com/specs/widgets.yaml')?.objectsGroup).toBe('Remote');
        expect(resolveApiFileOptions(api, ABS)).toBeNull();
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml', options: {} }, 'https://example.com/specs/widgets.yaml')).toBeNull();
    });
});
