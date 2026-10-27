import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { load as yamlLoad } from 'js-yaml';
import type {
  EmitterContext,
  FlatMethod,
  NamedType,
  OpensdkSpecJson,
  RenderedNestedType,
  RenderedTypeExpr,
  RenderedTypeField,
  RenderedTypeReference,
  RenderedTypeResponse,
} from './ir-types';
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

/**
 * This module calls the Rust core directly.
 *
 * It used to import the converter, opensdk-core, opensdk-framework and all SIX emitter
 * packages; those are being retired, and this module is what pulled them into CORE xyd's
 * dependency graph (xyd-plugin-docs' sdkEnrich imports it on the docs render path).
 *
 * The emitters were only ever the JS FALLBACK in `operationDocs` — the native batch docs
 * map was already tried first — so dropping the fallback removed them outright. No
 * compute moved to Rust: the Reference mutation below still runs in JS on in-memory
 * objects, which is deliberate (serializing the multi-MB reference set across the
 * boundary just to mutate it would be a pessimization).
 *
 * NATIVE-ONLY: `XYD_NATIVE=0` errors rather than silently degrading, because keeping a
 * fallback means keeping the dependency being removed.
 */
let nativeCache: Record<string, unknown> | null | undefined;
function loadNative(): Record<string, unknown> {
  if (process.env.XYD_NATIVE === '0') {
    throw new Error(
      'XYD_NATIVE=0 is not supported by opensdk-uniform: it has no JS fallback, because ' +
        'the TypeScript opensdk emitters it used to depend on are being retired.',
    );
  }
  if (nativeCache === undefined) {
    const embedded = (globalThis as Record<string, unknown>).__xydNativeCore as
      | Record<string, unknown>
      | undefined;
    if (embedded?.openapi2opensdk) {
      nativeCache = embedded;
    } else {
      try {
        nativeCache = createRequire(import.meta.url)('@xyd-js/native');
      } catch {
        nativeCache = null;
      }
    }
  }
  if (!nativeCache) {
    throw new Error(
      '@xyd-js/native is required by opensdk-uniform and could not be resolved. ' +
        'Build it with `pnpm --filter @xyd-js/native build:native`.',
    );
  }
  return nativeCache;
}

/** The batch docs surface per language, keyed by the `compileLang` id. */
const DOCS_FN_BY_LANG: Record<string, string> = {
  go: 'opensdkDocsGo',
  node: 'opensdkDocsNode',
  python: 'opensdkDocsPython',
  ruby: 'opensdkDocsRuby',
  java: 'opensdkDocsJava',
  dotnet: 'opensdkDocsDotnet',
};

/** The native batch docs function for a language, or null when that language has none
 * (rust implements neither docs capability and is not in SDK_LANGS).
 *
 * The napi surface returns a JSON STRING; this parses it and maps the `"null"` sentinel
 * to `null`, matching what `@xyd-js/opensdk-framework`'s loader did. Returning the raw
 * function instead silently fills `docsByLang` with strings, so every lookup misses and
 * every operation renders no snippet. */
function nativeDocsFn(
  compileLang: string,
): ((specJson: string, optionsJson?: string) => Record<string, NativeOperationDocs> | null) | null {
  const name = DOCS_FN_BY_LANG[compileLang];
  if (!name) return null;
  const fn = loadNative()[name];
  if (typeof fn !== 'function') return null;
  return (specJson: string, optionsJson?: string) => {
    const raw = (fn as (s: string, o?: string) => string)(specJson, optionsJson);
    return raw === 'null' ? null : (JSON.parse(raw) as Record<string, NativeOperationDocs>);
  };
}

interface NativeOperationDocs {
  usage: string;
  typeReference: unknown;
}

/** OpenAPI doc -> OpenSDK IR, through the native converter. */
function openapi2opensdk(doc: unknown, options: Record<string, unknown> = {}): OpensdkSpecJson {
  const native = loadNative();
  return JSON.parse(
    (native.openapi2opensdk as (d: string, o: string) => string)(
      JSON.stringify(doc),
      JSON.stringify(options),
    ),
  ) as OpensdkSpecJson;
}

/** Read + parse a spec file, then convert.
 *
 * Reading stays in JS deliberately: the native converter takes a parsed document, and
 * moving file/URL loading into Rust would put an HTTP client in the cdylib for no gain. */
async function openapi2opensdkFromSource(source: string): Promise<OpensdkSpecJson> {
  const raw = await readFile(source, 'utf8');
  const doc = /\.ya?ml$/i.test(source) ? yamlLoad(raw) : JSON.parse(raw);
  return openapi2opensdk(doc);
}

/** Walk the resource tree, yielding each method with its resource CHAIN (root -> owner).
 * Inlined from @xyd-js/opensdk-core (pure). */
function walkMethods(spec: OpensdkSpecJson): FlatMethod[] {
  const out: FlatMethod[] = [];
  const visit = (resources: unknown[], chain: string[]): void => {
    for (const r of resources) {
      const res = r as { name?: string; methods?: unknown[]; resources?: unknown[] };
      const next = [...chain, res.name ?? ''];
      for (const m of res.methods ?? [])
        out.push({ path: next, method: m } as FlatMethod);
      if (res.resources?.length) visit(res.resources, next);
    }
  };
  visit((spec as { resources?: unknown[] }).resources ?? [], []);
  return out;
}

/** One SDK language shown in the switcher. `language` is the coder highlight id
 * (drives the Atlas dropdown icon via langIconSet); `title` is the display label;
 * `compileLang` is the native docs-surface / toolchain id. */
export interface SdkLang {
  language: string;
  title: string;
  compileLang: string;
}

/** The SDK languages, in the DEFAULT switcher order (a `langs` request sets its own). */
export const SDK_LANGS: SdkLang[] = [
  { language: 'go', title: 'Go', compileLang: 'go' },
  { language: 'python', title: 'Python', compileLang: 'python' },
  { language: 'typescript', title: 'TypeScript', compileLang: 'node' },
  { language: 'ruby', title: 'Ruby', compileLang: 'ruby' },
  { language: 'java', title: 'Java', compileLang: 'java' },
  { language: 'csharp', title: 'C#', compileLang: 'dotnet' },
];

/** The tab-`language` ids the SDK switcher emits (for extraction/verification). */
export const SDK_TAB_LANGUAGES: ReadonlySet<string> = new Set(SDK_LANGS.map((l) => l.language));

/** Map a Uniform tab `language` to its `compileSmoke` toolchain id (or undefined
 * if it isn't an SDK tab — e.g. `shell`/`json`). */
export function resolveCompileLang(language: string): string | undefined {
  return SDK_LANGS.find((l) => l.language === language)?.compileLang;
}

export interface AttachSdkExamplesOptions {
  /** The SDK tab-`language` ids to attach, in switcher order (default: all six, in SDK_LANGS order). */
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
  /** Native docs, per emitter language id, keyed the same way as `byKey`.
   * Absent when @xyd-js/native is unavailable — callers then drive the JS
   * emitter capabilities. Computed ONCE per spec (see `nativeDocs`). */
  docsByLang: Map<string, Record<string, { usage: string; typeReference: unknown }>>;
}

/**
 * Every language's docs, in ONE native call each.
 *
 * The alternative — calling the native surface per operation per language — is
 * 242 × 6 boundary crossings for the OpenAI spec. This runs 6 times total, and
 * only for languages the native side actually implements; the rest fall through
 * to the JS emitter at the call sites.
 */
function nativeDocs(ir: OpensdkSpecJson): PreparedSdk['docsByLang'] {
  const out: PreparedSdk['docsByLang'] = new Map();
  let specJson: string | null = null;
  for (const lang of SDK_LANGS) {
    const fn = nativeDocsFn(lang.compileLang);
    if (!fn) continue;
    try {
      specJson ??= JSON.stringify(ir);
      const map = fn(specJson);
      if (map) out.set(lang.compileLang, map);
    } catch {
      // one language failing must not drop the others — it falls back to JS
    }
  }
  return out;
}

function prepareFromIr(ir: OpensdkSpecJson): PreparedSdk {
  const types = new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t]));
  const ctx: EmitterContext = { spec: ir, types, emitterOptions: {} };
  const byKey = new Map<string, FlatMethod>();
  for (const fm of walkMethods(ir)) {
    byKey.set(`${String(fm.method.httpMethod ?? '').toLowerCase()} ${fm.method.path}`, fm);
  }
  return { ir, ctx, byKey, docsByLang: nativeDocs(ir) };
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

/**
 * The language ids to render, in switcher order: a `requested` list (a docs
 * config's `sdk.languages`) narrows `available` (SDK_LANGS, or a spec's root
 * `x-sdk.languages`) AND sets the order — unknown ids drop, a repeated id keeps
 * its first position. No request → `available` as is. The raw-HTTP (cURL) entry
 * is not part of either list: it always comes first in the switcher.
 */
export function orderSdkLanguageIds(available: readonly string[], requested?: readonly string[] | null): string[] {
  if (!requested) return [...available];
  const out: string[] = [];
  for (const id of requested) {
    if (available.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** The SDK languages of a `langs` request, in the REQUESTED order — that order is
 * the switcher order (curl stays first). No request → every language, in SDK_LANGS order. */
function resolveLangs(langs?: string[]): SdkLang[] {
  if (!langs) return SDK_LANGS;
  return orderSdkLanguageIds(SDK_LANGS.map((l) => l.language), langs).map(
    (id) => SDK_LANGS.find((l) => l.language === id) as SdkLang,
  );
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

/**
 * One operation's docs for one language: the NATIVE batch result when present,
 * else the JS emitter capability.
 *
 * The native map is computed once per spec in `prepareFromIr`; a language the
 * native side does not implement (or a spec it could not handle) simply has no
 * entry, and that language falls through to TypeScript. Both paths produce the
 * same bytes — 1488 golden cases assert it.
 */
function operationDocs(
  prepared: PreparedSdk,
  lang: SdkLang,
  fm: FlatMethod,
  key: string,
): { usage?: string; typeReference?: RenderedTypeReference } {
  // Native-only: the emitter fallback that used to live here is what pulled all six
  // TypeScript emitter packages into this module (and therefore into core xyd).
  const native = prepared.docsByLang.get(lang.compileLang)?.[key];
  if (!native) return {};
  return {
    usage: native.usage,
    typeReference: native.typeReference as RenderedTypeReference,
  };
}

function attachExamplesPass(references: Reference[], prepared: PreparedSdk, langs: SdkLang[]): void {
  if (!langs.length) return;
  const { ctx, byKey } = prepared;

  for (const ref of references) {
    const rctx = ref.context as OpenAPIReferenceContext | undefined;
    if (!rctx?.method || !rctx?.path) continue; // component schema — no method
    const key = `${rctx.method.toLowerCase()} ${rctx.path}`;
    const fm = byKey.get(key);
    if (!fm) continue;

    const codeblock = requestCodeblock(ref);
    if (!codeblock) continue; // no curl tab (x-codeSamples) — respect the author

    const sdkTabs = [];
    for (const lang of langs) {
      try {
        const code = operationDocs(prepared, lang, fm, key).usage;
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

// ── Schema pages: which page a type links to ────────────────────────────────
//
// An SDK row typed by a component schema links to that schema's page — the
// same page the REST rows of the operation link to. A link must never land on
// a page that does not exist, so the page is RESOLVED, never assumed from the
// type name: a synthesized type (an inline envelope the converter hoisted) has
// no schema and no page; a hidden schema (`x-docs.hidden`) has a schema and no
// page; a schema with an `x-docs.path` has its page elsewhere than
// `objects/<Name>`.

const COMPONENT_SCHEMA_PREFIX = '#/components/schemas/';

type SymbolDef = NonNullable<DefinitionProperty['symbolDef']>;

/** `#/components/schemas/<Name>` → the page's canonical, or `undefined` when
 * the schema is known to have no page. Absent from the index = unknown. */
type SchemaPageIndex = Map<string, string | undefined>;

const firstString = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v.find((s) => typeof s === 'string') : v;

/**
 * The component pages a references list carries: `componentSchema` → the
 * page's canonical — the FINAL one after the x-docs pass (an `x-docs.path`),
 * when the list went through it; a hidden schema is then no longer in the
 * list, so it resolves to "no page". `null` when the list carries no
 * component page at all (a one-page, regions-mode list) — then the operation's
 * own REST rows are the evidence (see {@link restRowPages}).
 */
function componentPages(references: Reference[]): SchemaPageIndex | null {
  let any = false;
  const index: SchemaPageIndex = new Map();
  for (const ref of references) {
    const name = (ref.context as { componentSchema?: unknown } | undefined)?.componentSchema;
    if (typeof name !== 'string' || !name) continue;
    any = true;
    const id = `${COMPONENT_SCHEMA_PREFIX}${name}`;
    if (!index.has(id)) index.set(id, typeof ref.canonical === 'string' && ref.canonical ? ref.canonical : undefined);
  }
  return any ? index : null;
}

/**
 * The schema links an operation's own REST rows carry (`symbolDef.id` →
 * `symbolDef.canonical`), through nested rows and array items: every schema
 * reachable from the request and the response is linked there, finalised by
 * the x-docs pass when the rows went through it (a hidden schema's row keeps
 * its `id` and loses its `canonical`). Read BEFORE the SDK definitions are
 * written, off the REST definitions only — a prior run's SDK rows are not
 * evidence.
 */
function restRowPages(ref: Reference): SchemaPageIndex {
  const index: SchemaPageIndex = new Map();
  const seen = (symbolDef?: SymbolDef): void => {
    const id = firstString(symbolDef?.id);
    if (!id || !id.startsWith(COMPONENT_SCHEMA_PREFIX) || index.has(id)) return;
    index.set(id, firstString(symbolDef?.canonical) || undefined);
  };
  const walk = (prop: DefinitionProperty | undefined, depth: number): void => {
    if (!prop || depth > 64) return;
    seen(prop.symbolDef);
    for (const child of prop.properties ?? []) walk(child, depth + 1);
    walk(prop.ofProperty, depth + 1);
  };
  for (const def of ref.definitions ?? []) {
    if (isSdkDefinition(def)) continue;
    seen(def.symbolDef);
    for (const prop of def.properties ?? []) walk(prop, 0);
    walk(def.rootProperty, 0);
    for (const variant of def.variants ?? []) {
      seen(variant.symbolDef);
      for (const prop of variant.properties ?? []) walk(prop, 0);
      walk(variant.rootProperty, 0);
    }
  }
  return index;
}

/** What a rendered type links to — the row's `symbolDef`, or nothing. */
interface TypeOrigin {
  refTypeName?: string;
  schemaRef?: string;
}

/** The row context of one language's type reference: the nested lookup table
 * and the page evidence (the list's component pages, else the REST rows). */
interface RowContext {
  nested: Record<string, RenderedNestedType>;
  /** The component pages of the references list — authoritative when present. */
  pages: SchemaPageIndex | null;
  /** The operation's REST rows — the evidence in regions mode. */
  restPages: SchemaPageIndex;
}

/**
 * The link of a type: `{ id, canonical }` when its schema has a page, `{ id }`
 * when the schema is known to have none (the id stays, so a later x-docs pass
 * can still relink it), nothing when there is no schema to link.
 *
 * Resolution: the list's component pages, else the operation's REST rows;
 * a schema neither knows (regions mode, a schema the REST rows do not reach)
 * takes the converter's own page canonical, `objects/<Name>` — the x-docs pass
 * that runs on every generated page finalises or drops it like the REST rows'.
 * A type naming only an IR type (an `x-sdk` written before `schemaRef`) is a
 * guess at a schema — a synthesized type's name names none — so it links only
 * when the page evidence knows that schema: never a guessed `objects/<Type>`,
 * and no schema id either.
 */
function typeLink(origin: TypeOrigin, ctx: RowContext): SymbolDef | undefined {
  const id = origin.schemaRef ?? (origin.refTypeName ? `${COMPONENT_SCHEMA_PREFIX}${origin.refTypeName}` : undefined);
  if (!id || !id.startsWith(COMPONENT_SCHEMA_PREFIX)) return undefined;
  const known = ctx.pages ? ctx.pages : ctx.restPages.has(id) ? ctx.restPages : null;
  if (!origin.schemaRef && !known?.has(id)) return undefined;
  if (known) {
    const canonical = known.get(id);
    return canonical ? { id, canonical } : { id };
  }
  return { id, canonical: `objects/${id.slice(COMPONENT_SCHEMA_PREFIX.length)}` };
}

// ── Rows ────────────────────────────────────────────────────────────────────

/** How many named-type hops below a definition's rows expand. The nested table
 * is already capped at the emitter (`nestedDepth`); this bounds the rows when
 * a table carries more. */
const NESTED_ROW_DEPTH = 8;

/** The uniform property types the REST converter gives a choice row — an
 * enum's values, a union's variants — which Atlas presents as "possible
 * types": the type column prints the choices (`"a" | "b"`, `Assembly or
 * Part`) and the toggle reads `Show possible types`. Literals: this module
 * takes no runtime value from `@xyd-js/uniform` (`DEFINED_DEFINITION_PROPERTY_TYPE`). */
const ENUM_TYPE = '$$enum';
const XOR_TYPE = '$$xor';

/** The base type of an enum's values — the `enum-type` meta Atlas quotes a
 * string value by, the type of each value row — read off the values (the IR
 * carries them untyped): all strings `string`, all integers `integer`, all
 * numbers `number`, all booleans `boolean`; anything else is unknown (an empty
 * type, no `enum-type`, and Atlas reads the values as strings). */
function enumBaseType(values: readonly unknown[]): string {
  const kinds = new Set(values.map((v) => (typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v)));
  if (kinds.size === 1) {
    const [kind] = kinds;
    return kind === 'string' || kind === 'integer' || kind === 'number' || kind === 'boolean' ? kind : '';
  }
  return kinds.size === 2 && kinds.has('integer') && kinds.has('number') ? 'number' : '';
}

/** One enum value as the REST converter names its row: the value's text
 * (`basic`, `2`, `true`, `null`), an object or array value as JSON. Unquoted —
 * the type column quotes a string value from the `enum-type` meta. */
function enumValueName(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** The `const` meta's value: a scalar as it is, an object or array as JSON. */
function literalMetaValue(value: unknown): unknown {
  return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
}

/**
 * Shape a row by the type it names, from the nested table: a struct's fields
 * become its rows (each shaped in turn); an enum's values and a union's
 * variants become its possible types, in the shape the REST converter gives
 * such rows, so the SDK and the REST view of one field read alike; an alias
 * takes its target's shape. `stack` is the chain of types above the row — a
 * type already on it stops (a self- or mutually-referencing type renders once
 * per chain), as does the depth cap. A scalar, a type outside the table, or
 * no type at all leaves the row as it is: the language's type text.
 */
function shapeRow(row: DefinitionProperty, refTypeName: string | undefined, ctx: RowContext, stack: readonly string[]): void {
  if (!refTypeName || stack.includes(refTypeName) || stack.length >= NESTED_ROW_DEPTH) return;
  const type = ctx.nested[refTypeName];
  if (!type) return;
  const chain = [...stack, refTypeName];
  switch (type.kind) {
    case 'struct': {
      const rows = (type.fields ?? []).map((field) => toDefinitionProperty(field, ctx, chain));
      if (rows.length) row.properties = rows;
      return;
    }
    case 'enum':
      shapeEnumRow(row, type.values ?? []);
      return;
    case 'union':
      shapeUnionRow(row, type.variants ?? [], ctx, chain);
      return;
    case 'alias':
      if (type.of) shapeRow(row, type.of.refTypeName, ctx, chain);
      return;
    default:
      return;
  }
}

/** An enum row as the REST converter shapes one: `$$enum`, the `enum-type`
 * meta (and the `const` meta of a single value), one row per value — named by
 * the value, typed by the base type — and the base type as the `ofProperty`.
 * The type column then prints the values in place of the language's type
 * name, as it does for the REST rows. */
function shapeEnumRow(row: DefinitionProperty, values: readonly unknown[]): void {
  if (!values.length) return;
  const base = enumBaseType(values);
  const meta = [...(row.meta ?? [])];
  if (base) meta.push({ name: 'enum-type', value: base });
  if (values.length === 1) meta.push({ name: 'const', value: literalMetaValue(values[0]) });
  row.type = ENUM_TYPE;
  row.meta = meta;
  row.properties = values.map((value) => ({ name: enumValueName(value), type: base, description: '' }));
  row.ofProperty = { name: '', type: base, description: '' };
}

/** A union row as the REST converter shapes a `oneOf`: `$$xor` — the type
 * column spells the variants out, `Assembly or Part` — with one row per
 * variant, named after the row like the REST variants, typed and linked by
 * the variant and shaped by its type in turn. */
function shapeUnionRow(row: DefinitionProperty, variants: readonly RenderedTypeExpr[], ctx: RowContext, chain: readonly string[]): void {
  if (!variants.length) return;
  row.type = XOR_TYPE;
  row.properties = variants.map((variant) => {
    const option: DefinitionProperty = { name: row.name, type: variant.langType, description: '', symbolDef: typeLink(variant, ctx) };
    shapeRow(option, variant.refTypeName, ctx, chain);
    return option;
  });
}

/** One rendered SDK field → a Uniform property row: the language's name and
 * type text, the required/deprecated badges, the link to the type's schema
 * page when it has one, and — for a field typed by another type, through
 * arrays and maps — that type's shape: a struct's rows beneath (the same
 * expand/collapse the REST rows use), an enum's values or a union's variants
 * as its possible types. The type column keeps the language's spelling
 * (`[]Widget`, `Widget[]`, `List[Widget]`) except where the REST rows print
 * the choices too. */
function toDefinitionProperty(field: RenderedTypeField, ctx: RowContext, stack: readonly string[] = []): DefinitionProperty {
  const meta: DefinitionProperty['meta'] = [];
  if (field.required) meta.push({ name: 'required' });
  if (field.deprecated) meta.push({ name: 'deprecated' });
  const row: DefinitionProperty = {
    name: field.name,
    type: field.langType,
    description: field.description ?? '',
    meta: meta.length ? meta : undefined,
    symbolDef: typeLink(field, ctx),
  };
  shapeRow(row, field.refTypeName, ctx, stack);
  return row;
}

/** The property rows of a response type: struct → field rows; else a single row
 * naming the type (+ a note like "binary download"), linked to its schema page
 * and shaped by the nested table when the type names one (`[]Widget`
 * → the widget's fields). */
function responseProperties(response: RenderedTypeResponse, ctx: RowContext): DefinitionProperty[] {
  if (response.fields?.length) return response.fields.map((field) => toDefinitionProperty(field, ctx));
  const row: DefinitionProperty = {
    name: response.typeName ?? 'result',
    type: response.langType ?? response.typeName ?? '',
    description: response.note ?? '',
    symbolDef: typeLink(response, ctx),
  };
  shapeRow(row, response.refTypeName, ctx, []);
  return [row];
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
function sdkRequestVariant(lang: SdkLangLike, request: RenderedTypeReference['request'], ctx: RowContext): DefinitionVariant {
  const fields = request.fields.map((field) => toDefinitionProperty(field, ctx));
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
function sdkResponseVariant(lang: SdkLangLike, response: RenderedTypeReference['response'], ctx: RowContext): DefinitionVariant {
  if (response.fields?.length && response.typeName) {
    return {
      title: lang.title,
      meta: sdkLangMeta(lang),
      properties: [],
      rootProperty: {
        name: response.typeName,
        type: '',
        description: response.note ?? '',
        properties: response.fields.map((field) => toDefinitionProperty(field, ctx)),
      },
    };
  }
  return { title: lang.title, meta: sdkLangMeta(lang), properties: responseProperties(response, ctx) };
}

export interface AttachSdkTypesOptions {
  /** The SDK tab-`language` ids to attach, in switcher order (default: all six, in SDK_LANGS order). */
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
  const pages = componentPages(references);

  for (const ref of references) {
    const rctx = ref.context as OpenAPIReferenceContext | undefined;
    if (!rctx?.method || !rctx?.path) continue;
    const key = `${rctx.method.toLowerCase()} ${rctx.path}`;
    const fm = byKey.get(key);
    if (!fm) continue;

    const perLang: { lang: SdkLang; tref: RenderedTypeReference }[] = [];
    for (const lang of langs) {
      try {
        const tref = operationDocs(prepared, lang, fm, key).typeReference;
        if (tref) perLang.push({ lang, tref });
      } catch {
        // one language failing must not drop the others
      }
    }
    if (!perLang.length) continue; // leave the REST definitions intact
    applySdkTypes(ref, rctx, perLang, keepRest, pages);
  }
}

/** Write the per-language type references onto ONE reference: the Parameters/
 * Returns definitions (sdkLang variants), REST keep/replace handling, and the
 * header signatures. Shared by the generate + x-sdk paths — the two modes MUST
 * produce identical uniform output. `pages` is the references list's component
 * pages ({@link componentPages}), the link evidence beside this reference's
 * own REST rows. */
function applySdkTypes(
  ref: Reference,
  rctx: OpenAPIReferenceContext,
  perLang: { lang: SdkLangLike; tref: RenderedTypeReference }[],
  keepRest: boolean,
  pages: SchemaPageIndex | null,
): void {
  // The REST rows' links, read before anything below rewrites the definitions.
  const restPages = restRowPages(ref);
  const rowContext = (tref: RenderedTypeReference): RowContext => ({ nested: tref.nested ?? {}, pages, restPages });
  const paramVariants = perLang.map(({ lang, tref }) => sdkRequestVariant(lang, tref.request, rowContext(tref)));
  const returnVariants = perLang.map(({ lang, tref }) => sdkResponseVariant(lang, tref.response, rowContext(tref)));

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
  /** The SDK tab-`language` ids to attach, in switcher order (default: all six, in SDK_LANGS order). */
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
  /** The request/response type reference (the Parameters/Returns sections),
   * with the nested lookup table behind them when anything is referenced
   * (`opensdk xsdk` 0.2.2+; absent on an older embed — the rows then render
   * one level deep). */
  types?: {
    request: RenderedTypeReference['request'];
    response: RenderedTypeReference['response'];
    nested?: RenderedTypeReference['nested'];
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
  /** The SDK language ids to embed, in this order — it becomes the root `x-sdk.languages`
   * order, the switcher order (default: all six, in SDK_LANGS order). */
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
      const key = `${method} ${specPath}`;
      const fm = prepared.byKey.get(key);
      if (!fm) continue;

      const xop: XSdkOperation = {};
      for (const lang of langs) {
        const entry: XSdkOperationLang = {};
        try {
          const code = operationDocs(prepared, lang, fm, key).usage;
          if (code) entry.usage = code;
        } catch {
          // one language failing must not drop the others
        }
        try {
          const tref = operationDocs(prepared, lang, fm, key).typeReference;
          if (tref) {
            entry.signature = tref.signature;
            entry.types = { request: tref.request, response: tref.response };
            // The lookup table behind the two one-level groups — left out when
            // nothing is referenced, as `opensdk xsdk` does.
            if (tref.nested && Object.keys(tref.nested).length) entry.types.nested = tref.nested;
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
  /** The language ids to render, in switcher order — narrows the spec's
   * `x-sdk.languages` and sets their order (a docs config's `sdk.languages`).
   * Omit for the spec's own list and order. */
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

  // A `langs` request (the docs config) narrows the spec's list AND sets the
  // switcher order; without one the spec's own `x-sdk.languages` order is kept.
  const langIds = orderSdkLanguageIds(xsdk.languages, opts.langs);
  const displayLangs: SdkLangLike[] = langIds.map((id) => ({
    language: id,
    title: SDK_LANGS.find((l) => l.language === id)?.title ?? id,
  }));
  if (!displayLangs.length) return false;
  const pages = componentPages(references);

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
            tref: {
              signature: entry.signature ?? '',
              request: entry.types.request,
              response: entry.types.response,
              nested: entry.types.nested,
            },
          });
        }
      }
      if (perLang.length) applySdkTypes(ref, rctx, perLang, !!opts.keepRest, pages);
    }
  }
  return true;
}
