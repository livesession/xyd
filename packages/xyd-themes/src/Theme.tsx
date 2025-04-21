import * as React from "react"
import type { RootContent } from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxToMarkdown } from "mdast-util-mdx";
import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import { parse } from '@babel/parser';
import { highlight, HighlightedCode } from "codehike/code";

import { useMetadata } from "@xyd-js/framework/react";
import { type AtlasProps } from "@xyd-js/atlas";
import { type Theme as ThemeSettings } from "@xyd-js/core"

import { VarCode } from "@xyd-js/content";
import { ExampleRoot } from "@xyd-js/uniform";

import { metaComponent } from './decorators';


/**
 * List of standard MDAST node types
 */
const standardMdastTypes = [
  'root',
  'paragraph',
  'heading',
  'text',
  'emphasis',
  'strong',
  'delete',
  'blockquote',
  'code',
  'link',
  'image',
  'list',
  'listItem',
  'table',
  'tableRow',
  'tableCell',
  'html',
  'break',
  'thematicBreak',
  'definition',
  'footnoteDefinition',
  'footnoteReference',
  'inlineCode',
  'linkReference',
  'imageReference',
  'footnote',
  'tableCaption'
];

/**
 * Evaluate a tiny JSX expression string to a React element.
 * In real code you'd use @babel/parser + @babel/traverse or a runtime eval.
 */
function evalExpression(expr) {
  // WARNING: using eval is dangerous! Better to pre-compile or
  // have a map: { IconCode: IconCodeComponent, … }
  // Here we just do a naive regex:
  const tag = expr.match(/<(\w+)/)[1];
  return React.createElement(tag, null);
}


/**
 * Checks if a given type is a standard MDAST type
 * @param type The node type to check
 * @returns True if the type is a standard MDAST type, false otherwise
 */
function isStandardMdastType(type: string): boolean {
  return standardMdastTypes.includes(type);
}

function isMdxElement(type: string): boolean {
  return type === 'mdxJsxFlowElement'
}

interface AtlasVars {
  examples?: VarCode
}


// TODO: get object from atlas
// Define the type for an example object
interface ExampleObject {
  codeblock: {
    title: string;
    tabs: {
      title: string;
      language: string;
      code: string;
      highlighted: any; // TODO: fix
    }[];
  };
}

// Define the type for an example group
interface ExampleGroup {
  examples: ExampleObject[];
}

export abstract class Theme {
  constructor() {
  }

  protected useHideToc() {
    const meta = useMetadata()

    if (!meta) {
      return false
    }

    switch (meta.layout) {
      case "wide":
        return true
      case "center":
        return true
      default:
        return false
    }
  }

  protected useLayoutSize() {
    const meta = useMetadata()

    if (!meta) {
      return undefined
    }

    switch (meta.layout) {
      case "wide":
        return "large"
      default:
        return undefined
    }
  }

  // TODO: !!! COMPOSE API !!!!
  // TODO: this.themeSettings but currently issues with decorators
  @metaComponent("atlas", "Atlas")
  private async atlasMetaComponent(
    themeSettings: ThemeSettings,
    props: AtlasProps,
    vars: AtlasVars,
    treeChilds: readonly RootContent[]
  ) {
    const outputVarExamples: ExampleRoot = {
      groups: []
    }

    const oneExample = vars.examples?.length === 1 && !Array.isArray(vars.examples[0])

    // Helper function to create an example object
    function createExampleObject(example: any): ExampleObject {
      // Extract the highlighted property correctly
      const highlighted = example.highlighted || example;

      return {
        codeblock: {
          title: example.meta,
          tabs: [
            {
              title: example.meta,
              language: example.lang,
              code: example.code,
              highlighted: highlighted
            }
          ]
        }
      };
    }

    if (oneExample) {
      const example = vars.examples?.[0]
      if (Array.isArray(example) || !example) {
        return
      }

      outputVarExamples.groups.push({
        examples: [createExampleObject(example)]
      })
    } else {
      // Process each example or group of examples
      vars.examples?.forEach((item) => {
        if (Array.isArray(item)) {
          // This is a group with a title as the first element
          const groupTitle = item[0];
          const groupExamples = item.slice(1);

          const exampleGroup: ExampleGroup = {
            examples: []
          };

          // Process each example in the group
          groupExamples.forEach((example) => {
            if (example && typeof example === 'object') {
              exampleGroup.examples.push(createExampleObject(example));
            }
          });

          if (exampleGroup.examples.length > 0) {
            outputVarExamples.groups.push(exampleGroup);
          }
        } else if (item && typeof item === 'object') {
          // This is a single example
          const exampleGroup: ExampleGroup = {
            examples: [createExampleObject(item)]
          };

          outputVarExamples.groups.push(exampleGroup);
        }
      });
    }

    const reactElements: React.ReactNode[] = []

    // TODO: !! IMPORTANT !! BETTER COMPOSE TRANSFORMATION
    for (const child of treeChilds) {
      if (isStandardMdastType(child.type)) {
        const hast = toHast(child)
        const html = toHtml(hast)

        if (child.type === "heading" && child.depth === 1) {
          const firstChild = child.children[0];
          if (firstChild.type === 'text') {
            props.references[0].title = firstChild.value;
          }
        } else {
          const reactTree = jsxStringToReactTree(html)
          if (reactTree) {
            reactElements.push(reactTree)
          }
        }

        continue
      } else if (isMdxElement(child.type)) {
        const jsxString = toMarkdown(child, {
          extensions: [mdxToMarkdown()],
          handlers: {// TODO: find better solution how to convert such as structure?
            list(node, parent, context) {
              // call containerFlow as a method on context, so `this` stays correct
              const items = node.children
                .map(item => context.containerFlow(item, node))
                .join('\n')
              return `<ul>\n${items}\n</ul>`
            },
            listItem(node, parent, context) {
              // same here
              //@ts-ignore
              const content = context.containerFlow(node, parent).trim()
              return `<li>${content}</li>`
            },
          }
        });

        const reactTree = jsxStringToReactTree(jsxString)
        if (reactTree) {
          reactElements.push(reactTree)
        }
      }
    }

    if (reactElements.length > 0) {
      if (props.references[0].description && typeof props.references[0].description === "string") {
        reactElements.unshift(props.references[0].description)
      }
      // Create a combined React element from all the elements
      const combinedReactTree = React.createElement(React.Fragment, null, ...reactElements)

      props.references[0].description = combinedReactTree
    }

    if (
      outputVarExamples && 
      !outputVarExamples.groups.length &&
      props.references[0]?.examples.groups?.length
    ) {
      const promises: Promise<void>[] = []

      props.references[0].examples?.groups.forEach(group => {
        group.examples.forEach(example => {
          example.codeblock.tabs.forEach(tab => {
            
            async function highlightCode() {
              const highlighted = await highlight({
                value: tab.code,
                lang: tab.language,
                meta: tab.title,
              }, themeSettings?.markdown?.syntaxHighlight || "github-dark")

              tab.highlighted = highlighted
            }

            promises.push(highlightCode());
          });
        });
      });

      await Promise.all(promises);
    } else {
      if (props.references?.[0]) {
        props.references[0].examples = outputVarExamples;
      }
    }

    return props
    // TODO: in the future return a component directly here but we need good mechanism for transpiling?
  }

  public components() {
    return {
    }
  }
}

function buildElement(node) {
  if (!node) return null;
  switch (node.type) {
    case 'JSXElement': {
      // Resolve type (string for custom components)
      let type;
      const nameNode = node.openingElement.name;
      if (nameNode.type === 'JSXMemberExpression') {
        // flatten Foo.Bar to "Foo.Bar"
        const parts: string[] = [];
        let curr = nameNode;
        while (curr) {
          if (curr.property) parts.unshift(curr.property.name);
          curr = curr.object;
        }
        type = parts.join('.');
      } else {
        type = nameNode.name;
      }

      // Props
      const props = {};
      for (const attr of node.openingElement.attributes) {
        if (attr.type === 'JSXSpreadAttribute') {
          Object.assign(props, evaluateExpression(attr.argument));
          continue;
        }
        const key = attr.name.name;
        let value;
        if (!attr.value) {
          value = true;
        } else if (attr.value.type === 'StringLiteral' || attr.value.type === 'NumericLiteral' || attr.value.type === 'BooleanLiteral') {
          value = attr.value.value;
        } else if (attr.value.type === 'JSXExpressionContainer') {
          value = evaluateExpression(attr.value.expression);
        }
        props[key] = value;
      }

      // Children
      const children = node.children
        .map(child => {
          if (child.type === 'JSXText') {
            const text = child.value.replace(/\s+/g, ' ');
            return text.trim() ? text : null;
          }
          if (child.type === 'JSXExpressionContainer') {
            return child.expression.type === 'JSXElement' || child.expression.type === 'JSXFragment'
              ? buildElement(child.expression)
              : evaluateExpression(child.expression);
          }
          if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
            return buildElement(child);
          }
          return null;
        })
        .filter(c => c !== null);

      // Create React element
      return React.createElement(type, props, ...children);
    }

    case 'JSXFragment': {
      const children = node.children
        .map(child => (child.type === 'JSXElement' || child.type === 'JSXFragment')
          ? buildElement(child)
          : (child.type === 'JSXText' ? child.value.trim() || null : null)
        )
        .filter(Boolean);
      return React.createElement(React.Fragment, null, ...children);
    }

    default:
      return null;
  }
}

// Simplistic evaluator for static expressions: identifiers -> undefined, literals -> value, objects -> {}
function evaluateExpression(expr) {
  switch (expr.type) {
    case 'StringLiteral': return expr.value;
    case 'NumericLiteral': return expr.value;
    case 'BooleanLiteral': return expr.value;
    case 'ObjectExpression': {
      const obj = {};
      for (const prop of expr.properties) {
        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
          obj[prop.key.name] = evaluateExpression(prop.value);
        }
      }
      return obj;
    }
    // Add more cases (Identifier, CallExpression, etc.) as needed
    default:
      return undefined;
  }
}

// 4) Locate first JSX node
function findJSX(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return node;
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (Array.isArray(val)) {
      for (const child of val) {
        const found = findJSX(child);
        if (found) return found;
      }
    } else {
      const found = findJSX(val);
      if (found) return found;
    }
  }
  return null;
}

function jsxStringToReactTree(jsxString: string) {
  const ast = parse(jsxString, { sourceType: 'module', plugins: ['jsx'] });
  const rootJSX = findJSX(ast);
  if (!rootJSX) {
    return null
  }

  return buildElement(rootJSX)
}
