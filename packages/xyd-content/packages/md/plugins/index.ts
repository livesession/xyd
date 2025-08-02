import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from 'remark-directive'
import rehypeRaw from 'rehype-raw';
import { toHast } from 'mdast-util-to-hast'
import { toEstree } from 'hast-util-to-estree'
import { visit } from 'unist-util-visit'

import { Settings } from "@xyd-js/core";

import { remarkMdxToc, RemarkMdxTocOptions } from "./mdToc";
import { remarkInjectCodeMeta } from "./mdCode";
import { extractThemeSettings } from "./mdThemeSettings";
import { extractPage } from "./mdPage";
import { mdHeadingId } from "./mdHeadingId";
import { rehypeHeading } from "./rehypeHeading";
import { mdComponentDirective } from "./component-directives";
import { mdFunctionChangelog, mdFunctionImportCode, mdFunctionUniform, mdFunctionInclude } from "./functions"
import { mdCodeRehype } from "./developer-writing";
import { mdMeta } from "./meta";
import { mdComposer } from "./composer/mdComposer";
import { outputVars } from "./output-variables";
import { mdImage } from "./mdImage";
import { mdImageRehype } from "./mdImageRehype";

export function defaultRemarkPlugins(
    toc: RemarkMdxTocOptions,
    settings?: Settings
) {
    return [
        ...thirdPartyRemarkPlugins(),
        ...remarkPlugins(toc, settings),
    ]
}

export function thirdPartyRemarkPlugins() {
    return [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        remarkDirective
    ]
}

function remarkPlugins(
    toc: RemarkMdxTocOptions,
    settings?: Settings
) {
    return [
        mdHeadingId,
        remarkInjectCodeMeta,
        mdImage,
        remarkMdxToc(toc),
        extractThemeSettings, // TODO: to delet ?
        extractPage, // TODO: to delete ?
        outputVars,
        mdComponentDirective(settings),
        mdComposer(settings),
        ...remarkFunctionPlugins(settings),
        mdMeta(settings),
    ]
}

export function includeRemarkPlugins(settings?: Settings) {
    return [
        remarkGfm,
        remarkDirective,

        mdHeadingId,
        remarkInjectCodeMeta,
        outputVars,
        mdComponentDirective(settings),
        ...remarkFunctionPlugins(settings),
    ]
}

export function remarkFunctionPlugins(settings?: Settings) {
    return [
        mdFunctionImportCode(settings),
        mdFunctionUniform(settings),
        mdFunctionInclude(settings),
        mdFunctionChangelog(settings),
    ]
}

export function defaultRehypePlugins(settings?: Settings) {
    return [
        [rehypeRaw, {
            passThrough: ['mdxjsEsm', 'mdxJsxFlowElement', 'mdxJsxTextElement'],
        }] as any,
        rehypeHeading,
        mdImageRehype,
        mdCodeRehype(settings)
    ]
}

// TODO: !!! in the future better solution? currently its a hack to override mdx components (react-components) declared in the file !!!
export function recmaOverrideComponents() {
    return (tree: any) => {
      for (let i = 0; i < tree.body.length; i++) {
        const node = tree.body[i];
  
        if (
          node.type === 'FunctionDeclaration' &&
          /^[A-Z]/.test(node.id.name)
        ) {
          const name = node.id.name;

          if (name === "MDXContent") {
            continue
          }
  
          // Fallback: () => null
          const nullFn = {
            type: 'ArrowFunctionExpression',
            params: [],
            body: { type: 'Literal', value: null },
            expression: true,
          };
  
          const fileComponentsAndProp = {
            type: 'LogicalExpression',
            operator: '&&',
            left: { type: 'Identifier', name: 'fileComponents' },
            right: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'fileComponents' },
              property: { type: 'Identifier', name },
              computed: false,
            },
          };
  
          const fileComponentsFalse = {
            type: 'BinaryExpression',
            operator: '===',
            left: { type: 'Identifier', name: 'fileComponents' },
            right: { type: 'Literal', value: false },
          };
  
          const fallback = {
            type: 'ConditionalExpression',
            test: fileComponentsFalse,
            consequent: nullFn, // ✅ return a function that returns null
            alternate: { type: 'Identifier', name },
          };
  
          const overrideExpr = {
            type: 'ConditionalExpression',
            test: fileComponentsAndProp,
            consequent: fileComponentsAndProp,
            alternate: fallback,
          };
  
          const assignOverride = {
            type: 'ExpressionStatement',
            expression: {
              type: 'AssignmentExpression',
              operator: '=',
              left: { type: 'Identifier', name },
              right: overrideExpr,
            },
          };
  
          tree.body.splice(i + 1, 0, assignOverride);
          i++; // Skip newly inserted node
        }
      }
    };
  }
  
  export function defaultRecmaPlugins(settings?: Settings) {
    return [
        recmaOverrideComponents,
    ]
  }
