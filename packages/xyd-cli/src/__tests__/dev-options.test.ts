import { describe, it, expect } from 'vitest';

import { devOptions } from '../commands/dev';

// cli.ts dispatches a command as `(...commandArgs, globalFlags)`: the global
// flags are the LAST argument, a positional (the fast-serve document of
// `xyd dev ./openapi.yaml -p 4000`) comes before them.
describe('devOptions', () => {
    it('takes the global flags from the last argument', () => {
        expect(devOptions([{ port: 4000 }])).toEqual({ port: 4000 });
    });

    it('keeps the flags behind a positional document', () => {
        expect(devOptions(['./openapi.yaml', { port: 4000, verbose: true }])).toEqual({ port: 4000, verbose: true });
    });

    it('never mistakes the document for the options', () => {
        expect(devOptions(['./openapi.yaml'])).toEqual({});
        expect(devOptions([])).toEqual({});
        expect(devOptions([null])).toEqual({});
    });
});
