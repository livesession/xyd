import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from 'remark-directive'
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Plugin } from 'unified';

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

import { recmaOverrideComponents } from "./recmaOverrideComponents";

export function defaultRemarkPlugins(
  toc: RemarkMdxTocOptions,
  settings?: Settings
): Plugin[] {
  return [
    ...thirdPartyRemarkPlugins(),
    ...remarkPlugins(toc, settings),
  ]
}

export function thirdPartyRemarkPlugins(): Plugin[] {
  return [
    remarkFrontmatter,
    remarkMdxFrontmatter,
    remarkGfm,
    remarkDirective,
    remarkMath,
  ]
}

function remarkPlugins(
  toc: RemarkMdxTocOptions,
  settings?: Settings
): Plugin[] {
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

export function includeRemarkPlugins(settings?: Settings): Plugin[] {
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

export function remarkFunctionPlugins(settings?: Settings): Plugin[] {
  return [
    mdFunctionImportCode(settings),
    mdFunctionUniform(settings),
    mdFunctionInclude(settings),
    mdFunctionChangelog(settings),
  ]
}

let rehypeMermaid
async function getMermaidPlugin() {
  if (!rehypeMermaid) {
    rehypeMermaid = (await import('rehype-mermaid')).default
  }
  return rehypeMermaid
}

export async function thirdPartyRehypePlugins(settings?: Settings) {
  const plugins = [
    [rehypeRaw, {
      passThrough: ['mdxjsEsm', 'mdxJsxFlowElement', 'mdxJsxTextElement'],
    }] as any,
    rehypeKatex,
  ]

  if (settings?.integrations?.diagrams) {
    plugins.push(await getMermaidPlugin())
  }

  return plugins
}

export async function defaultRehypePlugins(settings?: Settings) {
  return [
    ...(await thirdPartyRehypePlugins(settings)),
    rehypeHeading,
    mdImageRehype,
    mdCodeRehype(settings),
  ]
}

export function defaultRecmaPlugins(settings?: Settings) {
  return [
    recmaOverrideComponents,
  ]
}
