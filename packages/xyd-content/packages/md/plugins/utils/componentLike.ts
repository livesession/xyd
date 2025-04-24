import * as fs from 'node:fs';

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
    // console.log(JSON.stringify(props), 999)
    console.time('componentLike:total');
    
    console.time('componentLike:createElement');
    const reactElement = React.createElement(componentName, props, ...children);
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