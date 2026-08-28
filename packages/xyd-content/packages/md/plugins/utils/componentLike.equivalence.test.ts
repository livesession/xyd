import { describe, it, expect } from 'vitest';
import * as React from 'react';

// the frozen legacy baseline + the shared compile helper (single source of truth
// for "the old engine", reused by the real-uniform/composer suite too).
import { legacyComponentLike, compileVia, type ComponentLikeFn } from './componentLike.equivalence-helpers';

// the new implementation under test
import { componentLike as newComponentLike } from './componentLike';

// A live React description tree, exactly the kind @xyd-js/composer injects into
// resolved Atlas references (Composer.ts) — the reason the props can't be plain JSON.
const desc = React.createElement('p', null, 'A ', React.createElement('strong', null, 'user'), ' object.');
const propDesc = React.createElement('span', null, 'the identifier');

// --- the compose matrix: every shape that flows through componentLike ---------
const MATRIX: { name: string; component: string; props: Record<string, any>; children?: any[] }[] = [
    {
        name: 'atlas — resolved references with React-element descriptions',
        component: 'Atlas',
        props: {
            references: [
                {
                    title: 'List users',
                    canonical: 'list-users',
                    description: desc,
                    type: 'rest_get',
                    context: { method: 'GET', path: '/users' },
                    definitions: [
                        {
                            title: 'Response',
                            properties: [
                                { name: 'id', type: 'string', description: propDesc, meta: [{ name: 'required', value: 'true' }] },
                                { name: 'count', type: 'number' },
                            ],
                        },
                    ],
                    examples: { groups: [] },
                },
            ],
        },
    },
    { name: 'atlas — empty references', component: 'Atlas', props: { references: [] } },
    { name: 'home — passthrough props', component: 'PageHome', props: { layout: 'page', title: 'Home', subtitle: 'Welcome' } },
    { name: 'bloghome — passthrough props', component: 'PageBlogHome', props: { layout: 'page' } },
    { name: 'firstslide — passthrough props', component: 'PageFirstSlide', props: { layout: 'page', title: 'Hi' } },
    // edge cases not covered by the mdx-parity fixtures:
    { name: 'edge — backslash-bearing string prop (ensureProperEscaping)', component: 'Atlas', props: { references: [{ title: 'X', canonical: 'x', examples: { groups: [{ examples: [{ codeblock: { tabs: [{ title: 'shell', language: 'shell', code: 'curl -X POST \\\n  https://api' }] } }] }] } }] } },
    { name: 'edge — raw React element prop (isValidElement short-circuit)', component: 'Atlas', props: { references: [], icon: React.createElement('svg', { width: 16 }) } },
    // NOTE: componentLike's sole caller (mdMeta.ts:172) always passes children=[],
    // so the top element is always self-closing and the composed React trees live
    // in the *attribute* estree (never as JSX children). Non-empty formatted
    // children is a dead path — byte-parity there would require re-implementing
    // micromark's flow-markdown whitespace handling — so it is intentionally not
    // asserted here.
];

describe('componentLike equivalence (new acorn path === legacy fromMarkdown path)', () => {
    for (const c of MATRIX) {
        it(`compiles identically: ${c.name}`, async () => {
            const legacy = await compileVia(legacyComponentLike, c.component, c.props, c.children ?? []);
            const next = await compileVia(newComponentLike as ComponentLikeFn, c.component, c.props, c.children ?? []);
            expect(next).toBe(legacy);
        });
    }

    it('the sole caller contract: componentLike returns { children: [node] }', () => {
        const out = newComponentLike('Atlas', { references: [] }, []);
        expect(out.type).toBe('root');
        expect(Array.isArray(out.children)).toBe(true);
        expect(out.children).toHaveLength(1);
        expect(out.children[0].type).toBe('mdxJsxFlowElement');
        expect(out.children[0].name).toBe('Atlas');
    });
});
