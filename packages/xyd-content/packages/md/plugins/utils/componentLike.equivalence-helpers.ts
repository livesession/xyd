// Shared test helpers for the componentLike equivalence suites. NOT a test file
// (no `.test.ts`) and NOT reachable from any tsup entry (only `*.test.ts` import
// it), so it never ships in dist — it just gives both equivalence suites a single
// source of truth for "the old engine".
//
// `legacyComponentLike` is the exact pre-change O(n²) `fromMarkdown` implementation,
// copied verbatim. It is the FROZEN baseline: the whole point of the equivalence
// tests is to prove the new acorn path in ./componentLike compiles byte-identically
// to this, so this copy must never be "improved".
import * as React from 'react';
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx';
import acornJsx from 'acorn-jsx';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxJsx } from 'micromark-extension-mdx-jsx';
import * as acorn from 'acorn';
import reactElementToJSXString from 'react-element-to-jsx-string';
import { compile } from '@mdx-js/mdx';

const acornWithJsx = acorn.Parser.extend(acornJsx());

/** Verbatim copy of componentLike.ts's ensureProperEscaping (see that file). */
export function ensureProperEscaping(obj: any): any {
    if (React.isValidElement(obj)) return obj;
    if (typeof obj === 'string') return obj.replace(/(?<!\\)\\(?!\\)/g, '\\\\');
    if (Array.isArray(obj)) return obj.map((item) => ensureProperEscaping(item));
    if (obj && typeof obj === 'object') {
        const result = { ...obj };
        for (const key in result) result[key] = ensureProperEscaping(result[key]);
        return result;
    }
    return obj;
}

/** The legacy (baseline) componentLike: React element → JSX string → the O(n²)
 *  micromark `fromMarkdown(mdxJsx)` reparse. This is exactly what the new acorn
 *  path replaces; equivalence tests assert new(...) ≡ this(...) after compile. */
export function legacyComponentLike(componentName: string, props: Record<string, any>, children: any[]) {
    const escapedProps = ensureProperEscaping(props);
    const escapedChildren = ensureProperEscaping(children);
    const reactElement = React.createElement(componentName, escapedProps, ...escapedChildren);
    const toJsxString: any = (reactElementToJSXString as any).default || reactElementToJSXString;
    const mdxString = toJsxString(reactElement);
    return fromMarkdown(mdxString, {
        extensions: [mdxJsx({ acorn: acornWithJsx, addResult: true })],
        mdastExtensions: [mdxJsxFromMarkdown()],
    });
}

export type ComponentLikeFn = (name: string, props: Record<string, any>, children: any[]) => any;

/** Compile a componentLike node exactly as production does (fs.ts:63-77):
 *  development:false, outputFormat:'function-body', jsx:false. A remark plugin
 *  splices the node into the tree (mirrors mdMeta.ts:172). Old and new run the
 *  identical compile, so any diff is purely componentLike's. */
export async function compileVia(
    cl: ComponentLikeFn,
    name: string,
    props: Record<string, any>,
    children: any[],
): Promise<string> {
    const inject = () => (tree: any) => {
        const root = cl(name, props, children);
        tree.children = root.children;
    };
    const out = await compile('', {
        remarkPlugins: [inject],
        development: false,
        outputFormat: 'function-body',
        jsx: false,
    });
    return String(out);
}
