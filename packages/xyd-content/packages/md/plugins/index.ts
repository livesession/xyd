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
    rehypeMermaid = (await import("rehype-mermaid")).default
  }
  return rehypeMermaid
}

let rehypeGraphviz
let graphviz

async function getGraphvizPlugin() {
  if (!rehypeGraphviz) {
    const graphizMod = (await import("@hpcc-js/wasm")).Graphviz
    graphviz = await graphizMod.load()

    rehypeGraphviz = (await import("rehype-graphviz")).default
  }

  return [
    rehypeGraphviz,
    {
      graphviz
    }
  ]
}

/**
 * Check if a specific diagram type is enabled in settings
 */
function isDiagramTypeEnabled(settings: Settings | undefined, diagramType: 'mermaid' | 'graphviz'): boolean {
  const diagrams = settings?.integrations?.diagrams;

  if (!diagrams) {
    return false;
  }

  // If diagrams is just true, all types are enabled
  if (diagrams === true) {
    return true;
  }

  // If diagrams is an array, check if the type is included
  if (Array.isArray(diagrams) && diagrams.includes(diagramType)) {
    return true;
  }

  // If diagrams is an object, check if the type is configured
  if (typeof diagrams === 'object' && !Array.isArray(diagrams)) {
    if (diagramType in diagrams) {
      return true;
    }
  }

  return false;
}

/**
 * Get options for a specific diagram type from settings
 */
function getDiagramOptions(settings: Settings | undefined, diagramType: 'mermaid' | 'graphviz') {
  const diagrams = settings?.integrations?.diagrams;

  if (!diagrams || typeof diagrams !== 'object' || Array.isArray(diagrams)) {
    return {};
  }

  return diagrams[diagramType] && typeof diagrams[diagramType] === 'object'
    ? diagrams[diagramType]
    : {};
}

export async function thirdPartyRehypePlugins(settings?: Settings) {
  const plugins = [
    [rehypeRaw, {
      // Ensure MDX expression nodes are passed through so `rehype-raw` doesn't try
      // to compile them into HAST — this prevents the "Cannot compile `mdxFlowExpression` node" error.
      passThrough: [
        'mdxjsEsm',
        'mdxJsxFlowElement',
        'mdxJsxTextElement',
        'mdxFlowExpression',
        'mdxTextExpression',
      ],
    }] as any,
    rehypeKatex,
  ]
  // Add mermaid plugin if enabled
  if (isDiagramTypeEnabled(settings, 'mermaid')) {
    const mermaidOptions = getDiagramOptions(settings, 'mermaid');
    plugins.push([await getMermaidPlugin(), mermaidOptions])
  }

  // Add graphviz plugin if enabled
  if (isDiagramTypeEnabled(settings, 'graphviz')) {
    const graphvizPlugin = await getGraphvizPlugin()
    plugins.push(graphvizPlugin)
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
