import { describe, it, expect } from 'vitest';

import { resolveApiFileOptions, resolveCliFileOptions } from './apiFileOptions';

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

    it('returns the objects collapsed flag of the entry, either way it is set', () => {
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml', options: { objectsCollapsed: false } }, ABS)).toEqual({ objectsCollapsed: false });
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml', options: { objectsCollapsed: true, objectsGroup: 'Types' } }, ABS)).toEqual({ objectsCollapsed: true, objectsGroup: 'Types' });
        expect(resolveApiFileOptions({ source: './specs/widgets.yaml', options: { objectsGroup: 'Types' } }, ABS)?.objectsCollapsed).toBeUndefined();
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

describe('resolveCliFileOptions', () => {
    const ROOT = '/site';
    const PER_COMMAND = { globalOptionsPerCommand: true };

    it('resolves the same entry from the config-relative source and from the absolute path', () => {
        // The sidebar build passes the source relative to the docs root, the
        // page step the absolute path of that file: both must see the entry.
        const api = [{ source: './acme.opencli.json', route: 'cli', options: PER_COMMAND }];
        expect(resolveCliFileOptions(api, 'acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
        expect(resolveCliFileOptions(api, './acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
        expect(resolveCliFileOptions(api, '/site/acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
    });

    it('prefers the entry naming the same file over a shorter suffix twin', () => {
        // The suffix rule alone would hand `/site/tools/acme.opencli.json` to the
        // first entry (`acme.opencli.json` is a suffix of it).
        const api = [
            { source: './acme.opencli.json', options: { globalOptionsPerCommand: false } },
            { source: './tools/acme.opencli.json', options: PER_COMMAND },
        ];
        expect(resolveCliFileOptions(api, '/site/tools/acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
        expect(resolveCliFileOptions(api, 'tools/acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
        expect(resolveCliFileOptions(api, '/site/acme.opencli.json', ROOT)).toEqual({ globalOptionsPerCommand: false });
    });

    it('resolves a source outside the docs root', () => {
        const api = { source: '../shared/acme.opencli.json', options: PER_COMMAND };
        expect(resolveCliFileOptions(api, '../shared/acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
        expect(resolveCliFileOptions(api, '/shared/acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
    });

    it('matches a URL source by equality', () => {
        const api = [
            { source: 'https://example.com/acme.opencli.json', options: PER_COMMAND },
            { source: './acme.opencli.json', options: { globalOptionsPerCommand: false } },
        ];
        expect(resolveCliFileOptions(api, 'https://example.com/acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
        expect(resolveCliFileOptions(api, '/site/acme.opencli.json', ROOT)).toEqual({ globalOptionsPerCommand: false });
    });

    it('a matching entry without options gets none, not another entry\'s', () => {
        const api = [{ source: './acme.opencli.json' }, { source: './other.opencli.json', options: PER_COMMAND }];
        expect(resolveCliFileOptions(api, '/site/acme.opencli.json', ROOT)).toBeNull();
    });

    it('falls back to the first entry with options when no entry names the source', () => {
        const api = { a: './unrelated.json', b: { source: './elsewhere/acme.opencli.json', options: PER_COMMAND } };
        expect(resolveCliFileOptions(api, '/site/acme.opencli.json', ROOT)).toEqual(PER_COMMAND);
        expect(resolveCliFileOptions('./acme.opencli.json', '/site/acme.opencli.json', ROOT)).toBeNull();
        expect(resolveCliFileOptions(undefined, '/site/acme.opencli.json', ROOT)).toBeNull();
        expect(resolveCliFileOptions(api, '', ROOT)).toBeNull();
    });
});
