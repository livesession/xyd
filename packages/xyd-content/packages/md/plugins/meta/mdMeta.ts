import { Root } from 'mdast';
import { matter } from 'vfile-matter';


import { Metadata, Settings, Theme } from '@xyd-js/core';
import { getMetaComponent } from '@xyd-js/context';

import { FunctionName } from '../functions/types';
import { parseFunctionCall } from '../functions/utils';
import { processUniformFunctionCall } from '../functions/uniformProcessor';
import { componentLike } from '../utils';
import { SymbolxVfile } from '../types';

export interface MdMetaOptions {
  resolveFrom?: string
}

// TODO: IT SHOULD BE PART OF COMPOSER

export function mdMeta(settings?: Settings, options?: MdMetaOptions) {
  return function() {
    return async (tree: Root, file: SymbolxVfile<any>) => {
      console.time('plugin:mdMeta:total');
      console.time('plugin:mdMeta:frontmatter');
      // Parse frontmatter and expose it at file.data.matter
      matter(file as any);
      console.timeEnd('plugin:mdMeta:frontmatter');

      if (!file.data.matter) {
        console.timeEnd('plugin:mdMeta:total');
        return
      }

      console.time('plugin:mdMeta:metaProcessing');
      const meta = file.data.matter as Metadata<Record<string, any>>
      if (!meta) {
        console.timeEnd('plugin:mdMeta:metaProcessing');
        console.timeEnd('plugin:mdMeta:total');
        return
      }

      if (meta?.uniform || meta?.openapi || meta?.graphql) {
        if (meta.graphql) {
          meta.uniform = meta.graphql
        } else if (meta.openapi) {
          meta.uniform = meta.openapi
        }
        meta.component = "atlas"
        meta.componentProps = {
          references: `@uniform('${meta.uniform}')`
        }
      }

      if (!meta || !meta.component) {
        console.timeEnd('plugin:mdMeta:metaProcessing');
        console.timeEnd('plugin:mdMeta:total');
        return
      }

      const metaComponent = getMetaComponent(meta.component)

      if (!metaComponent) {
        console.timeEnd('plugin:mdMeta:metaProcessing');
        console.timeEnd('plugin:mdMeta:total');
        return
      }
      console.timeEnd('plugin:mdMeta:metaProcessing');

      console.time('plugin:mdMeta:propsProcessing');
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
              options?.resolveFrom,
              settings,
            );

            resolvedProps[key] = references
          })()

          promises.push(promise)
        }
      }

      await Promise.all(promises)
      console.timeEnd('plugin:mdMeta:propsProcessing');

      console.time('plugin:mdMeta:transform');
      const resolvedComponentProps = await metaComponent.transform(
        (settings?.theme || {}) as Theme,
        resolvedProps,
        file.data.outputVars,
        Object.freeze(tree.children) as any
      )
      console.timeEnd('plugin:mdMeta:transform');

      console.time('plugin:mdMeta:componentCreation');
      const exportNode = componentLike(
        metaComponent.componentName,
        resolvedComponentProps,
        []
      )

      tree.children = [
        ...treeSanitize(tree),
        ...exportNode.children
      ]
      console.timeEnd('plugin:mdMeta:componentCreation');
      console.timeEnd('plugin:mdMeta:total');
    }
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