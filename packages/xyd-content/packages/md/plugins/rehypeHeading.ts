import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'hast';

import { mdParameters } from './utils/mdParameters';

export const rehypeHeading: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!node.tagName?.match(/^h[1-6]$/)) {
        return;
      }

      // Get the heading text
      const text = node.children
        .map((child) => ('value' in child ? child.value : ''))
        .join('');

      // Parse props using curly braces
      const { props } = mdParameters(text);

      if (node.properties?.hideHeading) {
        const existingStyle = node.properties?.style || '';
        node.properties = {
          ...node.properties,
          style: `${existingStyle} visibility: hidden; display: block`.trim()
        };
      }

      for (const child of node.children) {
        if (!('value' in child)) {
          continue
        }
        const { sanitizedText } = mdParameters(child.value);

        child.value = sanitizedText;
      }

      // If no props were found, return
      if (Object.keys(props).length === 0) {
        return;
      }

      node.properties = {
        ...node.properties,
        ...props,
      };
    });
  };
}; 