// Shared serializer for the enriched-uniform GOLDEN tests (1.sdk-uniform toy spec
// + the -2.complex.openai full spec). Takes References that have already been run
// through attachSdkExamples + attachSdkTypes, and captures ONLY the parts the SDK
// pipeline produces — the per-language SDK code tabs, the definition variants, and
// context.sdk (signatures per language) — in a deterministic, diffable shape.

import type { Definition, OpenAPIReferenceContext, Reference } from '@xyd-js/uniform';

import { SDK_TAB_LANGUAGES } from '../src/index';

export type GoldenVariant = {
  title?: string;
  sdkLang?: string;
  root?: { name: string; type: string } | null;
  properties: { name: string; type: string; required?: boolean; deprecated?: boolean; symbolDef?: string }[];
};

export type GoldenDefinition = { title?: string; type?: string; variants: GoldenVariant[] };

export type GoldenOperation = {
  operation: string;
  sdkTabs: { language: string; code: string }[];
  definitions: GoldenDefinition[];
  sdk: OpenAPIReferenceContext['sdk'] | undefined;
};

export function serializeVariant(v: NonNullable<Definition['variants']>[number]): GoldenVariant {
  const lang = v.meta?.find((m) => m.name === 'sdkLang')?.value as string | undefined;
  const src = v.rootProperty?.properties ?? v.properties ?? [];
  return {
    title: v.title,
    sdkLang: lang,
    root: v.rootProperty ? { name: v.rootProperty.name, type: v.rootProperty.type as string } : null,
    properties: src.map((p) => ({
      name: p.name,
      type: p.type as string,
      required: p.meta?.some((m) => m.name === 'required') || undefined,
      deprecated: p.meta?.some((m) => m.name === 'deprecated') || undefined,
      symbolDef: p.symbolDef?.canonical,
    })),
  };
}

/** Serialize one enriched Reference into the stable golden shape — ONLY the SDK
 * pipeline's output: the SDK code tabs, the definition variants, and context.sdk. */
export function serializeRef(ref: Reference): GoldenOperation {
  const rctx = ref.context as OpenAPIReferenceContext;
  const sdkTabs: { language: string; code: string }[] = [];
  for (const group of ref.examples?.groups ?? []) {
    for (const example of group.examples ?? []) {
      for (const tab of example.codeblock?.tabs ?? []) {
        if (SDK_TAB_LANGUAGES.has(tab.language) && tab.code) {
          sdkTabs.push({ language: tab.language, code: tab.code });
        }
      }
    }
  }
  const definitions: GoldenDefinition[] = (ref.definitions ?? []).map((d) => ({
    title: d.title,
    type: typeof d.type === 'string' ? d.type : undefined,
    variants: (d.variants ?? []).map(serializeVariant),
  }));
  return { operation: `${rctx.method} ${rctx.path}`, sdkTabs, definitions, sdk: rctx.sdk };
}

/** Serialize every enriched Reference into the golden array. */
export function buildGolden(refs: Reference[]): GoldenOperation[] {
  return refs.map(serializeRef);
}
