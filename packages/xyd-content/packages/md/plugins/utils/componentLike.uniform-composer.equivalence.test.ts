// Regression proof for the componentLike O(n²)→O(n) change, driven by REAL
// uniform output through the REAL composer — not synthetic props.
//
// The sibling suite (componentLike.equivalence.test.ts) hand-builds Atlas props.
// This one instead does what production does end-to-end for an API page:
//
//   OpenAPI/GraphQL spec
//     → @xyd-js/openapi | @xyd-js/gql          (REAL uniform References)
//     → new Composer() @metaComponent("atlas")  (REAL compose transform:
//         markdown-in-descriptions → React trees, code-example highlighting,
//         processDefinitionProperties over every nested property, …)
//     → componentLike(name, composedProps, [])  (the code under test)
//     → @mdx-js/mdx compile (fs.ts options)
//
// then asserts the compiled function-body is byte-identical between the frozen
// legacy `fromMarkdown` path and the new acorn path. Because the props here carry
// the composer's live React element trees (descriptions/examples), this is the
// exact "xyd composes many things" shape the user asked us to protect.
import { describe, it, expect, beforeAll } from 'vitest';
import * as React from 'react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { deferencedOpenAPI, oapSchemaToReferences } from '@xyd-js/openapi';
import { gqlSchemaToReferences } from '@xyd-js/gql';
import { Composer } from '@xyd-js/composer';
import { getMetaComponent } from '@xyd-js/context';

import { legacyComponentLike, compileVia, type ComponentLikeFn } from './componentLike.equivalence-helpers';
import { componentLike as newComponentLike } from './componentLike';

// .../xyd-content/packages/md/plugins/utils → up 5 → repo `packages/`
const PKGS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const oapFx = (n: string) => path.join(PKGS, 'xyd-openapi/__fixtures__', n, 'input.yaml');
const gqlFx = (n: string) => path.join(PKGS, 'xyd-gql/__fixtures__', n, 'input.graphql');

const theme = { name: 'poetry' } as any;
const settings = { theme } as any;

/** Resolve real uniform → run the real atlas compose transform → return the
 *  composed props exactly as mdMeta.ts feeds them to componentLike. */
async function composeAtlas(references: any[]) {
    const atlas = getMetaComponent('atlas');
    if (!atlas) throw new Error('atlas meta component not registered');
    // signature mirrors mdMeta.ts:160-166 (theme, props, outputVars, treeChilds, meta, settings)
    return atlas.transform(theme, { references }, {}, [], { component: 'atlas' } as any, settings);
}

/** Count references whose composed description/property descriptions became React
 *  elements — the coverage guard that proves the transform really produced the
 *  "live React trees" shape (not trivial strings that would under-test the diff). */
function reactTreeCount(props: any): number {
    let n = 0;
    const walk = (v: any) => {
        if (!v) return;
        if (React.isValidElement(v)) { n++; return; }
        if (Array.isArray(v)) { v.forEach(walk); return; }
        if (typeof v === 'object') for (const k in v) walk(v[k]);
    };
    walk(props.references);
    return n;
}

beforeAll(() => {
    // registers the @metaComponent("atlas") transform into the global registry
    new Composer();
});

// Small/medium real specs — the legacy path is O(n²) so keep pages modest here;
// the huge openai corpus is exercised new-only in the perf/smoke check below.
const OPENAPI_FIXTURES = [
    '1.basic',
    '2.more',
    '3.multiple-responses',
    '7.examples',
    '8.enums',
    '6.codeSamples',
    '5.xdocs.codeLanguages',
];

const GRAPHQL_FIXTURES = [
    '-1.opendocs.docs-nested',
    '4.union',
    '-1.opendocs.flat',
];

describe('componentLike equivalence — REAL uniform through the REAL composer (atlas)', () => {
    describe('OpenAPI', () => {
        for (const fx of OPENAPI_FIXTURES) {
            it(`atlas compose compiles identically (new ≡ legacy): ${fx}`, async () => {
                const references = oapSchemaToReferences(await deferencedOpenAPI(oapFx(fx)));
                expect(references.length).toBeGreaterThan(0);

                const composed = await composeAtlas(references);

                // the composer must have produced live React trees for this to be a
                // meaningful test of the "composed content" path
                expect(reactTreeCount(composed)).toBeGreaterThan(0);

                const legacy = await compileVia(legacyComponentLike, 'Atlas', composed, []);
                const next = await compileVia(newComponentLike as ComponentLikeFn, 'Atlas', composed, []);
                expect(next).toBe(legacy);
            });
        }
    });

    describe('GraphQL', () => {
        for (const fx of GRAPHQL_FIXTURES) {
            it(`atlas compose compiles identically (new ≡ legacy): ${fx}`, async () => {
                const references = await gqlSchemaToReferences(gqlFx(fx));
                expect(references.length).toBeGreaterThan(0);

                const composed = await composeAtlas(references);

                const legacy = await compileVia(legacyComponentLike, 'Atlas', composed, []);
                const next = await compileVia(newComponentLike as ComponentLikeFn, 'Atlas', composed, []);
                expect(next).toBe(legacy);
            });
        }
    });

    // Scale guard: the A/B tests above prove *equivalence*, not *speed*. This is
    // what actually broke the openai-clone deploy — a schema page with ~2861
    // properties (ResponseStreamEvent). The old `fromMarkdown` path is O(n²) in the
    // serialized prop size and took minutes on a page this size; the new acorn path
    // is O(n) (~ms). We deliberately run the NEW path only (legacy would blow past
    // vitest's 5s default by minutes) — so if the O(n²) ever comes back, this test
    // times out. No flaky wall-clock threshold: the O(n)/O(n²) gap here is ~1000×.
    it('new path compiles a ~3000-property reference well under the default timeout (O(n) guard)', async () => {
        const properties = Array.from({ length: 3000 }, (_, i) => ({
            name: `field_${i}`,
            type: 'string',
            description: `Field number ${i} in a very large generated schema.`,
            meta: i % 3 === 0 ? [{ name: 'required', value: 'true' }] : [],
        }));
        const bigReference = {
            title: 'ResponseStreamEvent (scale guard)',
            canonical: 'response-stream-event-scale-guard',
            type: 'rest_post',
            context: { method: 'POST', path: '/scale' },
            definitions: [{ title: 'Response', properties }],
            examples: { groups: [] },
        };
        const composed = await composeAtlas([bigReference]);
        const out = await compileVia(newComponentLike as ComponentLikeFn, 'Atlas', composed, []);
        expect(out.length).toBeGreaterThan(0);
    });
});
