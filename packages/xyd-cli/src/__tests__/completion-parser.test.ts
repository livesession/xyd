import { describe, expect, it } from 'vitest';

import { cliToOpencli, parseUsageArguments } from '../completion-parser';
import { cliSpec } from '../spec';

describe('cliToOpencli', () => {
    it('derives an OpenCLI document from the live cliSpec', () => {
        const spec = cliToOpencli(cliSpec);
        expect(spec.opencli).toBe('1.0.0');
        expect(spec.info.title).toBe('xyd');

        // global flags → recursive root options; type drives the value arg
        const port = spec.options?.find((o) => o.name === 'port');
        expect(port?.recursive).toBe(true);
        expect(port?.aliases).toEqual(['p']);
        expect(port?.arguments).toEqual([{ name: 'number' }]); // Number → takes a value
        expect(spec.options?.find((o) => o.name === 'help')?.arguments).toBeUndefined(); // Boolean → switch

        // commands present; migrateme gets a positional from its usage line
        expect(spec.commands?.map((c) => c.name)).toEqual(
            expect.arrayContaining(['dev', 'build', 'serve', 'install', 'migrateme', 'components', 'completion']),
        );
        const migrate = spec.commands?.find((c) => c.name === 'migrateme');
        expect(migrate?.arguments).toEqual([{ name: 'resource', required: true }]);
    });
});

describe('parseUsageArguments', () => {
    it('parses required/optional positionals and skips flag placeholders', () => {
        expect(parseUsageArguments('xyd migrateme <resource> [flags]')).toEqual([{ name: 'resource', required: true }]);
        expect(parseUsageArguments('xyd dev [flags]')).toEqual([]);
    });
});
