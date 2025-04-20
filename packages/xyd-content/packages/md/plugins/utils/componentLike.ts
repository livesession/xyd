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
    const reactElement = React.createElement(componentName, props, ...children);

    // Convert the React element to a JSX string
    const mdxString = reactElementToJSXString.default(reactElement);

    // Parse the JSX string to get proper MDX attributes
    const ast = fromMarkdown(mdxString, {
        extensions: [mdxJsx({
            acorn: acornWithJsx,
            addResult: true
        })],
        mdastExtensions: [mdxJsxFromMarkdown()]
    });

    return ast
}