import { openapi2opensdk, openapi2opensdkFromSource } from '@xyd-js/openapi2opensdk';
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

// ── Prepared SDK state (compute the IR + method index ONCE) ─────────────────

/** The OpenSDK IR + emitter context + method index, computed once per spec.
 * Opaque to callers — build it with {@link prepareSdk} /
 * {@link prepareSdkFromSource} and feed it to {@link attachSdk}. */
export interface PreparedSdk {
  ir: OpensdkSpecJson;
  ctx: EmitterContext;
  byKey: Map<string, FlatMethod>;
}

function prepareFromIr(ir: OpensdkSpecJson): PreparedSdk {
  const types = new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t]));
  const ctx: EmitterContext = { spec: ir, types, emitterOptions: {} };
  const byKey = new Map<string, FlatMethod>();
  for (const fm of walkMethods(ir)) {
    byKey.set(`${fm.method.httpMethod.toLowerCase()} ${fm.method.path}`, fm);
  }
  return { ir, ctx, byKey };
}

/** Build the prepared SDK state from a RAW un-dereferenced doc
 * (`openapi2opensdk` needs `$ref` identity). null for a mid-edit /
 * unsupported doc — enrichment then no-ops (REST view untouched). */
export function prepareSdk(rawDoc: OpenAPIV3.Document): PreparedSdk | null {
  try {
    return prepareFromIr(openapi2opensdk(rawDoc));
  } catch {
    return null;
  }
}

/** {@link prepareSdk} from a file path / URL — reads + YAML-parses WITHOUT
 * dereferencing (the docs-framework seam; no yaml handling for callers). */
export async function prepareSdkFromSource(source: string): Promise<PreparedSdk | null> {
  try {
    return prepareFromIr(await openapi2opensdkFromSource(source));
  } catch {
    return null;
  }
}

function resolveLangs(langs?: string[]): SdkLang[] {
  return langs ? SDK_LANGS.filter((l) => langs.includes(l.language)) : SDK_LANGS;
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
  const prepared = prepareSdk(rawDoc);
  if (!prepared) return; // not OpenAPI 3.x / no paths / mid-edit — leave the HTTP samples
  attachExamplesPass(references, prepared, resolveLangs(opts.langs));
}

function attachExamplesPass(references: Reference[], prepared: PreparedSdk, langs: SdkLang[]): void {
  if (!langs.length) return;
  const { ctx, byKey } = prepared;

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
        // `meta` = the tab IDENTITY (`meta || lang` downstream): the language
        // ID, so the page-wide switcher stores ids ("python"), never display
        // titles ("Python") — signatures/variants key off the id.
        if (code) sdkTabs.push({ title: lang.title, language: lang.language, code, meta: lang.language });
      } catch {
        // one language failing must not drop the others
      }
    }
    if (!sdkTabs.length) continue;
    applySdkTabs(codeblock, sdkTabs);
  }
}

/** One switcher: curl FIRST (the raw-HTTP view is the default — the switcher
 * opens on it), then the SDK calls in language order. Idempotent — prior SDK
 * tabs are rebuilt, never stacked. Shared by the generate + x-sdk paths. */
function applySdkTabs(codeblock: CodeBlock, sdkTabs: CodeBlock['tabs']): void {
  const curl = codeblock.tabs.find((t) => isCurl(t.language));
  codeblock.tabs = curl ? [curl, ...sdkTabs] : sdkTabs;
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

/** The identity a variant/tab builder needs — a full {@link SdkLang} for the
 * generate path, or a bare `{ language, title }` for x-sdk-carried languages. */
interface SdkLangLike {
  language: string;
  title: string;
}

function sdkLangMeta(lang: SdkLangLike): DefinitionVariant['meta'] {
  return [{ name: 'sdkLang', value: lang.language }];
}

/**
 * A request-params variant. When the language passes a single params TYPE
 * (Go/Node/Java), nest the fields under a `<argName> <TypeName>` root — like
 * OpenAI's `body AudioTranscriptionNewParams` (here e.g. `query SessionListParams`),
 * mirroring the call `client.Sessions.List(ctx, query)`. Languages that flatten
 * params into the call (Python/Ruby/.NET) show the fields directly.
 */
function sdkRequestVariant(lang: SdkLangLike, request: RenderedTypeReference['request']): DefinitionVariant {
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
function sdkResponseVariant(lang: SdkLangLike, response: RenderedTypeReference['response']): DefinitionVariant {
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
  /**
   * Keep the REST param/response definitions instead of dropping them, tagged
   * with definition-level meta `{ name: "sdkFlavor", value: "http" }` — Atlas
   * then shows THEM (not the SDK types) when the raw-HTTP/cURL entry of the
   * language switcher is active. Default false (replace, the legacy behavior).
   */
  keepRest?: boolean;
}

/** A definition produced by the SDK types pass (its variants carry `sdkLang`). */
function isSdkDefinition(def: Definition): boolean {
  return !!def.variants?.some((v) => v.meta?.some((m) => m.name === 'sdkLang'));
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
  const prepared = prepareSdk(rawDoc);
  if (!prepared) return;
  attachTypesPass(references, prepared, resolveLangs(opts.langs), !!opts.keepRest);
}

function attachTypesPass(
  references: Reference[],
  prepared: PreparedSdk,
  langs: SdkLang[],
  keepRest: boolean,
): void {
  if (!langs.length) return;
  const { ctx, byKey } = prepared;

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
    applySdkTypes(ref, rctx, perLang, keepRest);
  }
}

/** Write the per-language type references onto ONE reference: the Parameters/
 * Returns definitions (sdkLang variants), REST keep/replace handling, and the
 * header signatures. Shared by the generate + x-sdk paths — the two modes MUST
 * produce identical uniform output. */
function applySdkTypes(
  ref: Reference,
  rctx: OpenAPIReferenceContext,
  perLang: { lang: SdkLangLike; tref: RenderedTypeReference }[],
  keepRest: boolean,
): void {
  const paramVariants = perLang.map(({ lang, tref }) => sdkRequestVariant(lang, tref.request));
  const returnVariants = perLang.map(({ lang, tref }) => sdkResponseVariant(lang, tref.response));

  const sdkDefs: Definition[] = [];
  // OpenAI-style: a "Parameters" section whose per-language root reads
  // `<argName> <ParamsType>` (or flat kwargs), and a "Returns" section.
  if (perLang.some((p) => p.tref.request.fields.length)) {
    sdkDefs.push({ title: 'Parameters', properties: [], variants: paramVariants });
  }
  sdkDefs.push({ title: 'Returns', properties: [], variants: returnVariants, type: 'return' });

  // Idempotent: rebuild — a prior run's SDK definitions never stack.
  const existing = (ref.definitions ?? []).filter((d) => !isSdkDefinition(d));
  if (keepRest) {
    // Keep the REST definitions, tagged so Atlas can show them for the
    // raw-HTTP (cURL) entry of the language switcher instead of SDK types.
    for (const d of existing) {
      if (isRestDefinition(d) && !d.meta?.some((m) => m.name === 'sdkFlavor')) {
        d.meta = [...(d.meta ?? []), { name: 'sdkFlavor', value: 'http' }];
      }
    }
    ref.definitions = [...sdkDefs, ...existing];
  } else {
    // Replace REST definitions; keep any non-REST ones (legacy behavior).
    ref.definitions = [...sdkDefs, ...existing.filter((d) => !isRestDefinition(d))];
  }

  // Header signatures (one per language) + the type names for $IntroHeader.
  const signatures: Record<string, string> = {};
  for (const { lang, tref } of perLang) signatures[lang.language] = tref.signature;
  rctx.sdk = {
    signatures,
    requestTypeName: perLang.find((p) => p.tref.request.typeName)?.tref.request.typeName,
    responseTypeName: perLang.find((p) => p.tref.response.typeName)?.tref.response.typeName,
  };
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

// ── Combined single-IR entry point (the docs-framework seam) ────────────────

export interface AttachSdkOptions {
  /** Rewrite request samples to the SDK-usage switcher. Default true. */
  examples?: boolean;
  /** Attach SDK type definitions + header signatures. Default true. */
  types?: boolean;
  /** Restrict to a subset of SDK tab-`language` ids (default: all six). */
  langs?: string[];
  /** Keep (and tag) the REST definitions — see {@link AttachSdkTypesOptions.keepRest}. */
  keepRest?: boolean;
}

/**
 * Run both enrichment passes off ONE prepared IR ({@link prepareSdk} /
 * {@link prepareSdkFromSource}) — the build-time integration computes the IR
 * once per spec and enriches every page's references from it. Equivalent to
 * `attachSdkExamples` + `attachSdkTypes` with a single `openapi2opensdk` run.
 */
export function attachSdk(references: Reference[], prepared: PreparedSdk, opts: AttachSdkOptions = {}): void {
  const langs = resolveLangs(opts.langs);
  if (opts.examples !== false) attachExamplesPass(references, prepared, langs);
  if (opts.types !== false) attachTypesPass(references, prepared, langs, !!opts.keepRest);
}

// ── x-sdk: the spec-carried SDK docs extension ──────────────────────────────
//
// Like `x-docs`, `x-sdk` lets the OpenAPI document itself carry everything the
// docs need — here the per-language SDK artifacts (signature, usage sample,
// request/response type reference). A CI/CD pipeline embeds them once with
// `embedXSdk` (or `opensdk xsdk`); the docs engine then only READS the spec via
// `attachSdkFromSpec` — no OpenSDK generation at docs-build time, and the docs
// always match the SDKs the pipeline actually shipped.
//
// The payload is the emitter-contract shape (`RenderedTypeReference`) plus the
// rendered signature/usage — exactly what the generate path computes — so
// embed→read produces byte-identical uniform output to `attachSdk`.

/** The root `x-sdk` object: which languages the document carries, in switcher
 * order. Its presence on the document root is the opt-in — no docs config
 * needed. */
export interface XSdk {
  languages: string[];
}

/** One language's artifacts on an operation's `x-sdk`. */
export interface XSdkOperationLang {
  /** The method signature shown in the operation header. */
  signature?: string;
  /** The rendered usage sample (the request-pane code tab). */
  usage?: string;
  /** The request/response type reference (the Parameters/Returns sections). */
  types?: {
    request: RenderedTypeReference['request'];
    response: RenderedTypeReference['response'];
  };
}

/** An operation's `x-sdk`: artifacts keyed by language id. */
export type XSdkOperation = Record<string, XSdkOperationLang>;

export const XSDK_KEY = 'x-sdk';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

/** Read the root `x-sdk` off a (raw or dereferenced — extensions survive both)
 * OpenAPI document. null when absent or malformed. */
export function getXSdk(doc: OpenAPIV3.Document): XSdk | null {
  const x = (doc as unknown as Record<string, unknown>)?.[XSDK_KEY] as XSdk | undefined;
  if (!x || !Array.isArray(x.languages)) return null;
  const languages = x.languages.filter((l): l is string => typeof l === 'string' && !!l);
  return languages.length ? { languages } : null;
}

/** Read + parse a RAW OpenAPI spec (file path or URL, YAML or JSON) WITHOUT
 * dereferencing. null on any failure — callers treat it as "no spec". */
export async function loadSpecSource(source: string): Promise<OpenAPIV3.Document | null> {
  try {
    let content: string;
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const res = await fetch(source);
      if (!res.ok) return null;
      content = await res.text();
    } else {
      const fs = await import('node:fs/promises');
      content = await fs.readFile(source, 'utf-8');
    }
    if (source.endsWith('.json') || content.trimStart().startsWith('{')) {
      return JSON.parse(content) as OpenAPIV3.Document;
    }
    const yaml = await import('js-yaml');
    return yaml.load(content) as OpenAPIV3.Document;
  } catch {
    return null;
  }
}

export interface EmbedXSdkOptions {
  /** Restrict to a subset of SDK language ids (default: all six). */
  langs?: string[];
}

export interface EmbedXSdkResult {
  /** A CLONE of the input with `x-sdk` embedded (root + per operation). */
  doc: OpenAPIV3.Document;
  /** How many operations received `x-sdk` data. */
  operations: number;
  /** The language ids written to the root `x-sdk.languages`. */
  languages: string[];
}

/**
 * The CI/CD-side writer: compute every operation's per-language SDK artifacts
 * (via the OpenSDK emitters) and embed them into a CLONE of the RAW spec as
 * `x-sdk` extensions. Ship the result as your published OpenAPI — any xyd docs
 * site then renders SDK-native docs from it without running the generator.
 */
export function embedXSdk(rawDoc: OpenAPIV3.Document, opts: EmbedXSdkOptions = {}): EmbedXSdkResult {
  const prepared = prepareSdk(rawDoc);
  if (!prepared) {
    throw new Error('embedXSdk: unsupported OpenAPI document (not 3.x / no paths)');
  }
  const langs = resolveLangs(opts.langs);
  if (!langs.length) {
    throw new Error(`embedXSdk: no known SDK languages in [${(opts.langs ?? []).join(', ')}]`);
  }

  const doc = JSON.parse(JSON.stringify(rawDoc)) as OpenAPIV3.Document;
  let operations = 0;

  for (const [specPath, pathItem] of Object.entries(doc.paths ?? {})) {
    if (!pathItem) continue;
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      const fm = prepared.byKey.get(`${method} ${specPath}`);
      if (!fm) continue;

      const xop: XSdkOperation = {};
      for (const lang of langs) {
        const entry: XSdkOperationLang = {};
        try {
          const code = lang.emitter.generateUsage?.(fm.method, fm.path, prepared.ctx);
          if (code) entry.usage = code;
        } catch {
          // one language failing must not drop the others
        }
        try {
          const tref = lang.emitter.generateTypeReference?.(fm.method, fm.path, prepared.ctx);
          if (tref) {
            entry.signature = tref.signature;
            entry.types = { request: tref.request, response: tref.response };
          }
        } catch {
          // ditto
        }
        if (entry.usage || entry.types) xop[lang.language] = entry;
      }
      if (Object.keys(xop).length) {
        (op as Record<string, unknown>)[XSDK_KEY] = xop;
        operations++;
      }
    }
  }

  const languages = langs.map((l) => l.language);
  (doc as unknown as Record<string, unknown>)[XSDK_KEY] = { languages } satisfies XSdk;
  return { doc, operations, languages };
}

export interface AttachSdkFromSpecOptions {
  /** Rewrite request samples to the SDK-usage switcher. Default true. */
  examples?: boolean;
  /** Attach SDK type definitions + header signatures. Default true. */
  types?: boolean;
  /** Narrow the spec's `x-sdk.languages` (e.g. from docs config). */
  langs?: string[];
  /** Keep (and tag) the REST definitions — see {@link AttachSdkTypesOptions.keepRest}. */
  keepRest?: boolean;
}

/**
 * The docs-side reader: enrich uniform References (in place) from the spec's
 * OWN `x-sdk` extensions — no emitters, no IR, just data the pipeline already
 * embedded. Returns false when the document carries no root `x-sdk` (callers
 * fall back to generate mode or plain REST). Unknown language ids are rendered
 * with the id as the display title.
 */
export function attachSdkFromSpec(
  references: Reference[],
  doc: OpenAPIV3.Document,
  opts: AttachSdkFromSpecOptions = {},
): boolean {
  const xsdk = getXSdk(doc);
  if (!xsdk) return false;

  const langIds = opts.langs ? xsdk.languages.filter((l) => opts.langs!.includes(l)) : xsdk.languages;
  const displayLangs: SdkLangLike[] = langIds.map((id) => ({
    language: id,
    title: SDK_LANGS.find((l) => l.language === id)?.title ?? id,
  }));
  if (!displayLangs.length) return false;

  for (const ref of references) {
    const rctx = ref.context as OpenAPIReferenceContext | undefined;
    if (!rctx?.method || !rctx?.path) continue; // component schema — no method
    const pathItem = doc.paths?.[rctx.path] as Record<string, unknown> | undefined;
    const op = pathItem?.[rctx.method.toLowerCase()] as Record<string, unknown> | undefined;
    const xop = op?.[XSDK_KEY] as XSdkOperation | undefined;
    if (!xop) continue;

    if (opts.examples !== false) {
      const codeblock = requestCodeblock(ref);
      if (codeblock) {
        const sdkTabs: CodeBlock['tabs'] = [];
        for (const lang of displayLangs) {
          const entry = xop[lang.language];
          // `meta` = the tab IDENTITY — same contract as the generate path.
          if (entry?.usage) sdkTabs.push({ title: lang.title, language: lang.language, code: entry.usage, meta: lang.language });
        }
        if (sdkTabs.length) applySdkTabs(codeblock, sdkTabs);
      }
    }

    if (opts.types !== false) {
      const perLang: { lang: SdkLangLike; tref: RenderedTypeReference }[] = [];
      for (const lang of displayLangs) {
        const entry = xop[lang.language];
        if (entry?.types?.request && entry.types.response) {
          perLang.push({
            lang,
            tref: { signature: entry.signature ?? '', request: entry.types.request, response: entry.types.response },
          });
        }
      }
      if (perLang.length) applySdkTypes(ref, rctx, perLang, !!opts.keepRest);
    }
  }
  return true;
}
