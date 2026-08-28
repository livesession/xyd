import * as React from 'react';
import acornJsx from 'acorn-jsx';
import * as acorn from 'acorn';
import reactElementToJSXString from 'react-element-to-jsx-string';

const acornWithJsx = acorn.Parser.extend(acornJsx());

/**
 * Turn a composed meta-component (Atlas, PageHome, …) + its props into the mdast
 * `mdxJsxFlowElement` node the `@mdx-js/mdx` compile consumes.
 *
 * Historically this did `React.createElement → reactElementToJSXString →
 * fromMarkdown(micromark, mdxJsx)`. The `fromMarkdown` step is O(n²) in the
 * serialized prop size — micromark tokenises the single huge JSX string as
 * markdown — so a large Atlas page (e.g. a 2861-property OpenAPI schema) took
 * minutes to compile. A plain `acorn` parse of the same string is O(n).
 *
 * We keep the (linear) React-element serialisation and instead parse the JSX
 * with `acorn` once, then build the equivalent `mdxJsxFlowElement` node by hand,
 * attaching each `{…}` expression's estree in the exact shape the downstream
 * reader (`hast-util-to-estree`) uses: `value.data.estree` = a
 * `Program{ body:[ ExpressionStatement ] }`. Only the element/attribute `name`s
 * and `value.data.estree` are read by the compile (the raw expression string and
 * all unist/estree positions are inert under `development:false, jsx:false` with
 * no SourceMapGenerator — see packages/.../fs.ts), so the compiled function-body
 * is identical to the old `fromMarkdown` path. Verified by the mdx-parity golden
 * harness + the componentLike equivalence test.
 */
export function componentLike(
    componentName: string,
    props: Record<string, any>,
    children: any[]
) {
    // Ensure proper escaping in props and children before creating the React
    // element (preserves live React elements — see ensureProperEscaping).
    const escapedProps = ensureProperEscaping(props);
    const escapedChildren = ensureProperEscaping(children);
    const reactElement = React.createElement(componentName, escapedProps, ...escapedChildren);

    // Serialize the element (incl. any nested React description/example trees) to
    // a JSX string. Linear. The CJS default-import interop differs by bundler
    // (tsup/Vite → `{default: fn}`; Bun.build → `fn`), so accept both shapes.
    const toJsxString: any = (reactElementToJSXString as any).default || reactElementToJSXString;
    const mdxString: string = toJsxString(reactElement);

    // Parse the JSX with acorn (O(n)) — replaces the O(n²) micromark `fromMarkdown`
    // reparse. The same parser (acorn + acorn-jsx) that the old mdxJsx extension
    // used internally, so the sub-expression estrees are equivalent.
    const jsxRoot: any = acornWithJsx.parseExpressionAt(mdxString, 0, {
        ecmaVersion: 'latest' as any,
    });
    const node = jsxEstreeToMdast(jsxRoot, mdxString);

    // The sole caller (mdMeta) consumes `.children`, so return a Root-shaped node.
    return { type: 'root', children: [node] };
}

/** The estree shape `micromark-util-events-to-acorn` produces for an mdx
 *  expression (and the shape `hast-util-to-estree` reads): a module `Program`
 *  whose single `ExpressionStatement` wraps the expression. */
function wrapProgram(expression: any) {
    return {
        type: 'Program',
        sourceType: 'module',
        comments: [],
        body: [{ type: 'ExpressionStatement', expression }],
    };
}

/** Flatten a JSX element name to the mdast `name` string. */
function jsxNameToString(n: any): string | null {
    if (!n) return null;
    if (n.type === 'JSXIdentifier') return n.name;
    if (n.type === 'JSXMemberExpression') return `${jsxNameToString(n.object)}.${n.property.name}`;
    if (n.type === 'JSXNamespacedName') return `${n.namespace.name}:${n.name.name}`;
    return null;
}

/** JSX attribute estree → mdast attribute. */
function jsxAttrToMdast(attr: any, src: string): any {
    if (attr.type === 'JSXSpreadAttribute') {
        // `{...expr}` → mdxJsxExpressionAttribute; downstream reads
        // estree.body[0].expression.properties[0] as a SpreadElement.
        return {
            type: 'mdxJsxExpressionAttribute',
            value: src.slice(attr.start, attr.end),
            data: {
                estree: wrapProgram({
                    type: 'ObjectExpression',
                    properties: [{ type: 'SpreadElement', argument: attr.argument }],
                }),
            },
        };
    }
    const name = jsxNameToString(attr.name);
    if (attr.value == null) {
        // boolean attribute (`<X foo />`)
        return { type: 'mdxJsxAttribute', name, value: null };
    }
    if (attr.value.type === 'Literal') {
        // string attribute (`foo="bar"`) — kept as a plain decoded string
        return { type: 'mdxJsxAttribute', name, value: attr.value.value == null ? null : String(attr.value.value) };
    }
    if (attr.value.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression;
        return {
            type: 'mdxJsxAttribute',
            name,
            value: {
                type: 'mdxJsxAttributeValueExpression',
                value: src.slice(expr.start, expr.end),
                data: { estree: wrapProgram(expr) },
            },
        };
    }
    // A JSXElement/JSXFragment used directly as an attribute value (rare) —
    // treat it as an expression value.
    return {
        type: 'mdxJsxAttribute',
        name,
        value: {
            type: 'mdxJsxAttributeValueExpression',
            value: src.slice(attr.value.start, attr.value.end),
            data: { estree: wrapProgram(attr.value) },
        },
    };
}

/** JSX child estree → mdast child. */
function jsxChildToMdast(child: any, src: string): any {
    if (child.type === 'JSXText') {
        return { type: 'text', value: child.value };
    }
    if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
        return jsxEstreeToMdast(child, src);
    }
    if (child.type === 'JSXExpressionContainer') {
        if (child.expression.type === 'JSXEmptyExpression') return null;
        return {
            type: 'mdxFlowExpression',
            value: src.slice(child.expression.start, child.expression.end),
            data: { estree: wrapProgram(child.expression) },
        };
    }
    return null;
}

/** JSX element/fragment estree → mdast mdxJsxFlowElement. */
function jsxEstreeToMdast(node: any, src: string): any {
    if (node.type === 'JSXFragment') {
        return {
            type: 'mdxJsxFlowElement',
            name: null,
            attributes: [],
            children: node.children.map((c: any) => jsxChildToMdast(c, src)).filter(Boolean),
        };
    }
    // JSXElement
    const name = jsxNameToString(node.openingElement.name);
    const attributes = node.openingElement.attributes.map((a: any) => jsxAttrToMdast(a, src));
    const children = node.children.map((c: any) => jsxChildToMdast(c, src)).filter(Boolean);
    return { type: 'mdxJsxFlowElement', name, attributes, children };
}

/**
 * Recursively ensures proper backslash escaping in string values.
 * Fixes backslashes like `curl --request POST \` into double `\\` to fix JSON format
 */
function ensureProperEscaping(obj: any): any {
    if (React.isValidElement(obj)) {
        return obj
    }
    // return obj
    if (typeof obj === 'string') {
        // Replace any single backslashes that aren't already part of an escape sequence
        return obj.replace(/(?<!\\)\\(?!\\)/g, '\\\\');
    }

    if (Array.isArray(obj)) {
        return obj.map(item => ensureProperEscaping(item));
    }

    if (obj && typeof obj === 'object') {
        const result = { ...obj };
        for (const key in result) {
            result[key] = ensureProperEscaping(result[key]);
        }
        return result;
    }

    return obj;
}
