import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'hast';

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

      // Extract attributes from curly braces
      const attributeMatch = text.match(/\s*{([^}]+)}\s*$/);
      if (!attributeMatch) {
        return;
      }

      // Remove the attributes from the text
      const headingText = text.slice(0, attributeMatch.index).trim();
      
      // Parse attributes like key="value"
      const attrString = attributeMatch[1];
      const attrMatches = attrString.matchAll(/(\w+)\s*=\s*"([^"]+)"/g);
      
      // Add attributes to the node's properties
      for (const [_, key, value] of attrMatches) {
        node.properties = {
          ...node.properties,
          [key]: value
        };
      }

      // Update the text content
      if (node.children[0] && 'value' in node.children[0]) {
        node.children[0].value = headingText;
      }
    });
  };
}; 