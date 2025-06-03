import * as fs from 'fs';
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx';
import * as React from 'react';
import acornJsx from 'acorn-jsx';
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import * as acorn from 'acorn';
import reactElementToJSXString from 'react-element-to-jsx-string';

const acornWithJsx = acorn.Parser.extend(acornJsx());

export function componentLike(
    componentName: string,
    props: Record<string, any>,
    children: any[]
) {
    console.time('componentLike:total');
    
    console.time('componentLike:createElement');
    // Ensure proper escaping in props and children before creating the React element
    const escapedProps = ensureProperEscaping(props);
    const escapedChildren = ensureProperEscaping(children);
    const reactElement = React.createElement(componentName, escapedProps, ...escapedChildren);
    console.timeEnd('componentLike:createElement');

    // Convert the React element to a JSX string
    console.time('componentLike:toJSXString');
    // @ts-ignore - The default property exists at runtime
    const mdxString = reactElementToJSXString.default(reactElement);
    console.timeEnd('componentLike:toJSXString');

    // Parse the JSX string to get proper MDX attributes
    console.time('componentLike:fromMarkdown');

    const ast = fromMarkdown(mdxString, {
        extensions: [mdxJsx({
            acorn: acornWithJsx,
            addResult: true
        })],
        mdastExtensions: [mdxJsxFromMarkdown()]
    });
    console.timeEnd('componentLike:fromMarkdown');
    
    console.timeEnd('componentLike:total');
    return ast
}


/**
 * Recursively ensures proper backslash escaping in string values.
 * Fixes backslashes like `curl --request POST \` into double `\\` to fix JSON format
 */
function ensureProperEscaping(obj: any): any {
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