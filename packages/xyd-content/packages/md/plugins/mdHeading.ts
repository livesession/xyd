import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import type { Plugin } from 'unified';
import type { Root, Heading } from 'mdast';

interface HeadingData {
  hProperties?: {
    id?: string;
    [key: string]: unknown;
  };
}

export const mdHeading: Plugin<[], Root> = () => {
  let slugger = new GithubSlugger();

  return (tree) => {
    visit(tree, 'heading', (node: Heading & { data?: HeadingData }) => {
      if (!node.data) {
        node.data = {};
      }

      if (node.depth === 1) {
        slugger.reset();
      }

      // Create a slug from the heading text
      const text = node.children
        .map((child) => ('value' in child ? child.value : ''))
        .join('');

      const id = slugger.slug(text);

      // Add the id to the heading's data
      node.data.hProperties = {
        ...node.data.hProperties,
        id,
      };
    });
  };
}; 