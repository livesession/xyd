import { openapi2opensdk } from '@xyd-js/openapi2opensdk';
import { type FlatMethod, type NamedType, type OpensdkSpecJson, walkMethods } from '@xyd-js/opensdk-core';
import { dotnetEmitter } from '@xyd-js/opensdk-dotnet';
import type { Emitter, EmitterContext, RenderedTypeField, RenderedTypeReference } from '@xyd-js/opensdk-framework';
import { goEmitter } from '@xyd-js/opensdk-go';
import { javaEmitter } from '@xyd-js/opensdk-java';
import { nodeEmitter } from '@xyd-js/opensdk-node';
import { pythonEmitter } from '@xyd-js/opensdk-python';
import { rubyEmitter } from '@xyd-js/opensdk-ruby';
import type {
  CodeBlock,
  Definition,
  DefinitionProperty,
  DefinitionVariant,
  OpenAPIReferenceContext,
  Reference,
  UniformPlugin,
} from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';

/** One SDK language shown in the switcher. `language` is the coder highlight id
 * (drives the Atlas dropdown icon via langIconSet); `title` is the display label;
 * `compileLang` is the `@xyd-js/opensdk-ci` `compileSmoke` toolchain id. */
export interface SdkLang {
  emitter: Emitter;
  language: string;
  title: string;
  compileLang: string;
}

/** The SDK languages, in switcher order. */
export const SDK_LANGS: SdkLang[] = [
  { emitter: goEmitter, language: 'go', title: 'Go', compileLang: 'go' },
  { emitter: pythonEmitter, language: 'python', title: 'Python', compileLang: 'python' },
  { emitter: nodeEmitter, language: 'typescript', title: 'TypeScript', compileLang: 'node' },
  { emitter: rubyEmitter, language: 'ruby', title: 'Ruby', compileLang: 'ruby' },
  { emitter: javaEmitter, language: 'java', title: 'Java', compileLang: 'java' },
  { emitter: dotnetEmitter, language: 'csharp', title: 'C#', compileLang: 'dotnet' },
];

/** The tab-`language` ids the SDK switcher emits (for extraction/verification). */
export const SDK_TAB_LANGUAGES: ReadonlySet<string> = new Set(SDK_LANGS.map((l) => l.language));

/** Map a Uniform tab `language` to its `compileSmoke` toolchain id (or undefined
 * if it isn't an SDK tab — e.g. `shell`/`json`). */
export function resolveCompileLang(language: string): string | undefined {
  return SDK_LANGS.find((l) => l.language === language)?.compileLang;
}

export interface AttachSdkExamplesOptions {
  /** Restrict to a subset of SDK tab-`language` ids (default: all six). */
  langs?: string[];
}

const isCurl = (lang?: string): boolean => lang === 'shell' || lang === 'curl';

/** The request codeblock of a reference — the one carrying the raw-HTTP curl tab
 * (auto-generated samples). x-codeSamples specs have no curl tab → left alone. */
function requestCodeblock(ref: Reference): CodeBlock | undefined {
  for (const group of ref.examples?.groups ?? []) {
    for (const example of group.examples ?? []) {
      if (example.codeblock?.tabs?.some((t) => isCurl(t.language))) {
        return example.codeblock;
      }
    }
  }
  return undefined;
}

/**
 * Enrich uniform References (in place) with OpenSDK usage examples, provider
 * style: rewrite each operation's request-sample tabs to ONE switcher — the SDK
 * call per language (property-filled, idiomatic), keeping curl as the raw-HTTP
 * option. Atlas renders the new tabs straight off `Reference.examples`.
 *
 * Best-effort — a mid-edit / unsupported doc keeps the HTTP samples untouched.
 * Takes the RAW un-dereferenced doc (`openapi2opensdk` needs `$ref` identity).
 */
export function attachSdkExamples(
  references: Reference[],
  rawDoc: OpenAPIV3.Document,
  opts: AttachSdkExamplesOptions = {},
): void {
  const langs = opts.langs ? SDK_LANGS.filter((l) => opts.langs?.includes(l.language)) : SDK_LANGS;
  if (!langs.length) return;

  let ir: OpensdkSpecJson;
  try {
    ir = openapi2opensdk(rawDoc);
  } catch {
    return; // not OpenAPI 3.x / no paths / mid-edit — leave the HTTP samples
  }

  const types = new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t]));
  const ctx: EmitterContext = { spec: ir, types, emitterOptions: {} };

  // Index the SDK methods by "get /pets" to match a Reference's operation.
  const byKey = new Map<string, FlatMethod>();
  for (const fm of walkMethods(ir)) {
    byKey.set(`${fm.method.httpMethod.toLowerCase()} ${fm.method.path}`, fm);
  }

  for (const ref of references) {
    const rctx = ref.context as OpenAPIReferenceContext | undefined;
    if (!rctx?.method || !rctx?.path) continue; // component schema — no method
    const fm = byKey.get(`${rctx.method.toLowerCase()} ${rctx.path}`);
    if (!fm) continue;

    const codeblock = requestCodeblock(ref);
    if (!codeblock) continue; // no curl tab (x-codeSamples) — respect the author

    const sdkTabs = [];
    for (const lang of langs) {
      try {
        const code = lang.emitter.generateUsage?.(fm.method, fm.path, ctx);
        if (code) sdkTabs.push({ title: lang.title, language: lang.language, code });
      } catch {
        // one language failing must not drop the others
      }
    }
    if (!sdkTabs.length) continue;

    // One switcher: SDK calls first, curl last.
    const curl = codeblock.tabs.find((t) => isCurl(t.language));
    codeblock.tabs = curl ? [...sdkTabs, curl] : sdkTabs;
  }
}

/**
 * The same enrichment as a Uniform plugin, for callers that drive the general
 * `uniform(references, { plugins })` pipeline. The raw `$ref`'d doc is captured
 * in a closure (the plugin API only hands over the dereferenced `references`).
 */
export function opensdkUniformPlugin(
  rawDoc: OpenAPIV3.Document,
  opts?: AttachSdkExamplesOptions,
): UniformPlugin<Record<string, never>> {
  return ({ references }) => {
    attachSdkExamples(Array.isArray(references) ? references : [references], rawDoc, opts);
    return () => {};
  };
}

/** Pull every SDK code tab out of enriched References — `{ language, code }` for
 * each go/python/typescript/ruby/java/csharp tab. The verification seam: route
 * each by `resolveCompileLang` and compile/parse it per language. */
export function extractSdkTabs(references: Reference[]): { language: string; code: string }[] {
  const tabs: { language: string; code: string }[] = [];
  for (const ref of references) {
    for (const group of ref.examples?.groups ?? []) {
      for (const example of group.examples ?? []) {
        for (const tab of example.codeblock?.tabs ?? []) {
          if (SDK_TAB_LANGUAGES.has(tab.language) && tab.code) {
            tabs.push({ language: tab.language, code: tab.code });
          }
        }
      }
    }
  }
  return tabs;
}

// ── SDK TYPE references (the SDK-native definitions view) ──────────────────

/** A REST definition (query/path/header/body params or the REST response) — the
 * ones SDK types REPLACE. Non-REST definitions (e.g. auth scopes) are kept. */
function isRestDefinition(def: Definition): boolean {
  return def.type === 'return' || (typeof def.type === 'string' && def.type.startsWith('$rest.'));
}

/** One rendered SDK field → a Uniform property row (name + lang type + required
 * badge + a cross-type link for nested refs). */
function toDefinitionProperty(field: RenderedTypeField): DefinitionProperty {
  const meta: DefinitionProperty['meta'] = [];
  if (field.required) meta.push({ name: 'required' });
  if (field.deprecated) meta.push({ name: 'deprecated' });
  return {
    name: field.name,
    type: field.langType,
    description: field.description ?? '',
    meta: meta.length ? meta : undefined,
    // Link a nested type to its component-schema Reference (objects/<Schema>).
    symbolDef: field.refTypeName ? { canonical: `objects/${field.refTypeName}` } : undefined,
  };
}

/** The property rows of a response type: struct → field rows; else a single row
 * naming the type (+ a note like "binary download"). */
function responseProperties(response: RenderedTypeReference['response']): DefinitionProperty[] {
  if (response.fields?.length) return response.fields.map(toDefinitionProperty);
  return [
    {
      name: response.typeName ?? 'result',
      type: response.langType ?? response.typeName ?? '',
      description: response.note ?? '',
    },
  ];
}

function sdkLangMeta(lang: SdkLang): DefinitionVariant['meta'] {
  return [{ name: 'sdkLang', value: lang.language }];
}

/**
 * A request-params variant. When the language passes a single params TYPE
 * (Go/Node/Java), nest the fields under a `<argName> <TypeName>` root — like
 * OpenAI's `body AudioTranscriptionNewParams` (here e.g. `query SessionListParams`),
 * mirroring the call `client.Sessions.List(ctx, query)`. Languages that flatten
 * params into the call (Python/Ruby/.NET) show the fields directly.
 */
function sdkRequestVariant(lang: SdkLang, request: RenderedTypeReference['request']): DefinitionVariant {
  const fields = request.fields.map(toDefinitionProperty);
  if (request.typeName && request.argName) {
    return {
      title: lang.title,
      meta: sdkLangMeta(lang),
      properties: [],
      rootProperty: { name: request.argName, type: request.typeName, description: '', properties: fields },
    };
  }
  return { title: lang.title, meta: sdkLangMeta(lang), properties: fields };
}

/** A Returns variant: the response TYPE as a root with its struct fields, else a
 * single type row (binary/scalar/open-union). */
function sdkResponseVariant(lang: SdkLang, response: RenderedTypeReference['response']): DefinitionVariant {
  if (response.fields?.length && response.typeName) {
    return {
      title: lang.title,
      meta: sdkLangMeta(lang),
      properties: [],
      rootProperty: {
        name: response.typeName,
        type: '',
        description: response.note ?? '',
        properties: response.fields.map(toDefinitionProperty),
      },
    };
  }
  return { title: lang.title, meta: sdkLangMeta(lang), properties: responseProperties(response) };
}

export interface AttachSdkTypesOptions {
  /** Restrict to a subset of SDK tab-`language` ids (default: all six). */
  langs?: string[];
}

/**
 * Enrich uniform References (in place) with SDK TYPE references, replacing the
 * REST param/response definitions with the SDK's request params type + response
 * type — as `sdkLang` variants so ONE selector switches the language. Also
 * attaches the per-language method SIGNATURE (for the operation header) onto
 * `context.sdk`. Best-effort; a mid-edit / unsupported doc leaves REST intact.
 *
 * Takes the RAW un-dereferenced doc (`openapi2opensdk` needs `$ref` identity).
 */
export function attachSdkTypes(references: Reference[], rawDoc: OpenAPIV3.Document, opts: AttachSdkTypesOptions = {}): void {
  const langs = opts.langs ? SDK_LANGS.filter((l) => opts.langs?.includes(l.language)) : SDK_LANGS;
  if (!langs.length) return;

  let ir: OpensdkSpecJson;
  try {
    ir = openapi2opensdk(rawDoc);
  } catch {
    return;
  }

  const types = new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t]));
  const ctx: EmitterContext = { spec: ir, types, emitterOptions: {} };

  const byKey = new Map<string, FlatMethod>();
  for (const fm of walkMethods(ir)) {
    byKey.set(`${fm.method.httpMethod.toLowerCase()} ${fm.method.path}`, fm);
  }

  for (const ref of references) {
    const rctx = ref.context as OpenAPIReferenceContext | undefined;
    if (!rctx?.method || !rctx?.path) continue;
    const fm = byKey.get(`${rctx.method.toLowerCase()} ${rctx.path}`);
    if (!fm) continue;

    const perLang: { lang: SdkLang; tref: RenderedTypeReference }[] = [];
    for (const lang of langs) {
      try {
        const tref = lang.emitter.generateTypeReference?.(fm.method, fm.path, ctx);
        if (tref) perLang.push({ lang, tref });
      } catch {
        // one language failing must not drop the others
      }
    }
    if (!perLang.length) continue; // leave the REST definitions intact

    const paramVariants = perLang.map(({ lang, tref }) => sdkRequestVariant(lang, tref.request));
    const returnVariants = perLang.map(({ lang, tref }) => sdkResponseVariant(lang, tref.response));

    const sdkDefs: Definition[] = [];
    // OpenAI-style: a "Parameters" section whose per-language root reads
    // `<argName> <ParamsType>` (or flat kwargs), and a "Returns" section.
    if (perLang.some((p) => p.tref.request.fields.length)) {
      sdkDefs.push({ title: 'Parameters', properties: [], variants: paramVariants });
    }
    sdkDefs.push({ title: 'Returns', properties: [], variants: returnVariants, type: 'return' });

    // Replace REST definitions; keep any non-REST ones.
    const kept = (ref.definitions ?? []).filter((d) => !isRestDefinition(d));
    ref.definitions = [...sdkDefs, ...kept];

    // Header signatures (one per language) + the type names for $IntroHeader.
    const signatures: Record<string, string> = {};
    for (const { lang, tref } of perLang) signatures[lang.language] = tref.signature;
    rctx.sdk = {
      signatures,
      requestTypeName: perLang.find((p) => p.tref.request.typeName)?.tref.request.typeName,
      responseTypeName: perLang.find((p) => p.tref.response.typeName)?.tref.response.typeName,
    };
  }
}

/** `attachSdkTypes` as a Uniform plugin (the raw `$ref`'d doc via a closure). */
export function opensdkTypesUniformPlugin(
  rawDoc: OpenAPIV3.Document,
  opts?: AttachSdkTypesOptions,
): UniformPlugin<Record<string, never>> {
  return ({ references }) => {
    attachSdkTypes(Array.isArray(references) ? references : [references], rawDoc, opts);
    return () => {};
  };
}
