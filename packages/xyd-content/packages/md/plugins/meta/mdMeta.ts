import fs from 'node:fs';
import { Root } from 'mdast';
import { matter } from 'vfile-matter';

import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import * as acorn from 'acorn'
// Import the JSX plugin for Acorn
import acornJsx from 'acorn-jsx'

import { Metadata, Settings } from '@xyd-js/core';
import { getMetaComponent } from '@xyd-js/context';

import { FunctionName } from '../functions/types';
import { parseFunctionCall } from '../functions/utils';
import { processUniformFunctionCall } from '../functions/uniformProcessor';
import { componentLike } from '../utils';
import { SymbolxVfile } from '../types';
import { visit } from 'unist-util-visit';

export interface MdMetaOptions {
  resolveFrom?: string
}

// TODO: IT SHOULD BE PART OF COMPOSER

export function mdMeta(settings?: Settings) {
  return function (options: MdMetaOptions = {}) {
    return async function transformer(tree: Root, file: SymbolxVfile<any>) {
      // Parse frontmatter and expose it at file.data.matter
      matter(file as any);

      if (!file.data.matter) {
        return
      }

      const meta = file.data.matter as Metadata<Record<string, any>>
      if (!meta || !meta.component) {
        return
      }

      const metaComponent = getMetaComponent(meta.component)
      if (!metaComponent) {
        return
      }

      const promises: Promise<void>[] = []

      let resolvedProps: Record<string, any> = {}

      if (meta.componentProps && typeof meta.componentProps === "object") {
        for (const key in meta.componentProps) { // TODO: support nested props
          const value = meta.componentProps[key]

          const result = parseFunctionCall({
            children: [
              {
                type: "text",
                value: value
              }
            ]
          }, FunctionName.Uniform);

          if (!result) {
            resolvedProps[key] = value
            continue
          }

          const importPath = result[1]

          if (!importPath) {
            continue
          }

          const promise = (async () => {
            const references = await processUniformFunctionCall(
              importPath,
              file,
              options.resolveFrom,
              settings,
            );

            resolvedProps[key] = references
          })()

          promises.push(promise)
        }
      }

      await Promise.all(promises)

      const resolvedComponentProps = metaComponent.transform(
        resolvedProps,
        file.data.outputVars
      )

      const exportNode = componentLike(
        metaComponent.componentName,
        resolvedComponentProps,
        []
      )

      tree.children = [
        ...treeSanitize(tree),
        exportNode
      ]
    };
  }
}

// TODO: add more / BETTER SOLUTION FOR CLEARIN
const allowedNodes = [
  "mdxjsEsm",
  // "outputVars", // TODO: !!! cuz some issues with outputvars + containerDirective !!!
]

function treeSanitize(tree: Root) {
  return tree.children.filter((child) => {
    if (allowedNodes.includes(child.type)) {
      return true
    }

    return false
  })
}