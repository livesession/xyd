import { Root } from 'mdast';
import { matter } from 'vfile-matter';
import { visit } from "unist-util-visit";
import { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx-jsx';
import { mdxjs } from 'micromark-extension-mdxjs';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

import { Metadata, Settings } from '@xyd-js/core';
import { getMetaComponent } from '@xyd-js/context';

import { FunctionName } from '../functions/types';
import { parseFunctionCall } from '../functions/utils';
import { processUniformFunctionCall } from '../functions/uniformProcessor';
import { componentLike } from '../utils';
import { SymbolxVfile } from '../types';

export interface MdMetaOptions {
  resolveFrom?: string
}

export function mdMeta(settings?: Settings) {
  return function (options: MdMetaOptions = {}) {
    return async function transformer(tree: Root, file: SymbolxVfile<any>) {
      // Parse frontmatter and expose it at file.data.matter
      matter(file);

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

      console.log(file.data.outputVars)
      const resolvedComponentProps = metaComponent.transform(
        resolvedProps,
        file.data.outputVars
      )

      const exportNode = componentLike(
        metaComponent.componentName,
        resolvedComponentProps,
        []
      )

      // Replace the tree children with our new node
      tree.children = [exportNode]
    };
  }
}

