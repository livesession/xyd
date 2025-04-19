import { MdxJsxFlowElement, MdxJsxAttribute, mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import acornJsx from 'acorn-jsx';
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import * as acorn from 'acorn';
import React from 'react';
import reactElementToJSXString from 'react-element-to-jsx-string';

const acornWithJsx = acorn.Parser.extend(acornJsx());

/**
 * Converts a React element to its string representation using react-element-to-jsx-string
 * @param element React element to convert
 * @returns String representation of the React element
 */
export function reactElementToString(element: React.ReactElement | string | number | null | undefined): string {
    // Handle primitive values
    if (typeof element === 'string' || typeof element === 'number') {
        return String(element);
    }

    if (element === null || element === undefined) {
        return '';
    }

    // Handle React elements using react-element-to-jsx-string
    if (React.isValidElement(element)) {
        return reactElementToJSXString.default(element);
    }

    return '';
}

export function componentLike(
    componentName: string,
    props: Record<string, any>,
    children: any[]
) {
    // Create a React element using React.createElement
    const reactElement = React.createElement(componentName, props, ...children);

    // Convert the React element to a JSX string
    const mdxString = reactElementToJSXString.default(reactElement);

    console.log('mdxString', mdxString)
    
    // Parse the JSX string to get proper MDX attributes
    const ast = fromMarkdown(mdxString, {
        extensions: [mdxJsx({
            acorn: acornWithJsx,
            addResult: true
        })],
        mdastExtensions: [mdxJsxFromMarkdown()]
    });

    const w = ast.children[0]

    console.log(w, 3332)
    return w
}