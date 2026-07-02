import type { OpenAPIV3 } from 'openapi-types';
import { mergeSdkBehavior } from '@xyd-js/opensdk-core';
import type { Contact, License, OpensdkSpecJson, SdkInfo } from '@xyd-js/opensdk-core';

import { type DerivedTarget, deriveTarget } from './action';
import { buildMethod } from './method';
import { kebabCase, slug } from './naming';
import { SymbolTable } from './nominal';
import { ResourceTree } from './resourceTree';
import { securitySchemes } from './security';
import type { OpenApi2OpenSdkOptions } from './types';

const DEFAULT_HTTP_METHODS = ['get', 'put', 'patch', 'post', 'delete'];

function buildInfo(doc: OpenAPIV3.Document, sdkName: string, version: string): SdkInfo {
  const info: SdkInfo = { title: doc.info?.title || sdkName, version };
  const src = doc.info;
  if (src?.description) info.description = src.description;
  if ((src as { summary?: string })?.summary) info.summary = (src as { summary?: string }).summary;

  if (src?.contact) {
    const contact: Contact = {};
    if (src.contact.name) contact.name = src.contact.name;
    if (src.contact.url) contact.url = src.contact.url;
    if (src.contact.email) contact.email = src.contact.email;
    if (Object.keys(contact).length) info.contact = contact;
  }
  if (src?.license) {
    const license: License = {};
    if (src.license.name) license.name = src.license.name;
    if ((src.license as { identifier?: string }).identifier)
      license.identifier = (src.license as { identifier?: string }).identifier;
    if (src.license.url) license.url = src.license.url;
    if (Object.keys(license).length) info.license = license;
  }
  return info;
}

/**
 * Convert a RAW (un-dereferenced) OpenAPI 3.x document into an OpenSDK IR — a
 * nominal symbol table of named types plus a resource tree of typed methods.
 *
 * Pure and synchronous. Pass the raw document (with `$ref`s intact) so component
 * identity survives into named types — see {@link openapi2opensdkFromSource}.
 */
export function openapi2opensdk(doc: OpenAPIV3.Document, options: OpenApi2OpenSdkOptions = {}): OpensdkSpecJson {
  // Validation-lite: fail loudly on a non-OpenAPI-3.x or path-less document
  // instead of emitting an empty IR.
  const oasVersion = (doc as { openapi?: unknown } | null | undefined)?.openapi;
  if (typeof oasVersion !== 'string' || !oasVersion.startsWith('3.')) {
    throw new Error(
      `openapi2opensdk: not an OpenAPI 3.x document — missing or unsupported "openapi" version field (got ${JSON.stringify(oasVersion)})`,
    );
  }
  if (!doc.paths || Object.keys(doc.paths).length === 0) {
    throw new Error('openapi2opensdk: the document has no "paths" — nothing to convert into SDK methods');
  }

  const sdkName = options.sdkName ?? (slug(doc.info?.title || 'sdk') || 'sdk');
  const version = options.version ?? doc.info?.version ?? '0.0.0';
  const methods = (options.includeMethods ?? DEFAULT_HTTP_METHODS).map((m) => m.toLowerCase());

  const spec: OpensdkSpecJson = {
    opensdk: '1.0.0',
    info: buildInfo(doc, sdkName, version),
  };

  const servers = (doc.servers || []).map((s) => s.url).filter(Boolean);
  if (servers.length) spec.servers = servers;
  const security = securitySchemes(doc, sdkName, options.authEnvVar);
  if (security.length) spec.security = security;

  // The effective runtime behavior: per-API overrides deep-merged over the
  // canonical defaults. Computed up front because the idempotency policy
  // steers parameter handling (detect-and-strip) below.
  const sdk = mergeSdkBehavior(options.sdkBehavior);

  const symbols = new SymbolTable(doc);
  const tree = new ResourceTree();
  const paths = doc.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;
    if (options.includePaths && !options.includePaths.some((p) => path.startsWith(p))) continue;

    const pathItemParams = ((pathItem as OpenAPIV3.PathItemObject).parameters ||
      []) as OpenAPIV3.ParameterObject[];

    for (const method of methods) {
      const operation = (pathItem as Record<string, unknown>)[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation || typeof operation !== 'object') continue;

      const target = applyMounts(deriveTarget(method, path, operation, options), method, path, options);
      const built = buildMethod(doc, method, path, operation, pathItemParams, target, symbols, sdk);
      tree.insert(target.resourcePath, built);
    }
  }

  const types = symbols.emit();
  if (types.length) spec.types = types;
  const resources = tree.emit();
  if (resources.length) spec.resources = resources;

  // ALWAYS stamped (oagen-style): the IR carries the full runtime-behavior
  // contract so emitters and CI read policy values, never re-hardcode them.
  spec.sdk = sdk;

  return spec;
}

const splitSegments = (s: string): string[] =>
  s
    .split(/[/\s.]+/)
    .filter(Boolean)
    .map(kebabCase);

/**
 * Apply SDK-config grouping that isn't in the spec paths (oagen's
 * operationHints/mountRules): a per-operation `mountOn`/`action` override, then
 * longest-prefix `mountRules` remapping of the resource path — e.g.
 * `organization -> admin/organization` reproduces openai-go's admin namespace.
 */
function applyMounts(
  target: DerivedTarget,
  method: string,
  path: string,
  options: OpenApi2OpenSdkOptions,
): DerivedTarget {
  let resourcePath = target.resourcePath;
  let action = target.action;

  const hint = options.operationHints?.[`${method.toUpperCase()} ${path}`];
  if (hint?.mountOn) resourcePath = splitSegments(hint.mountOn);
  if (hint?.action) action = kebabCase(hint.action);

  if (options.mountRules && !hint?.mountOn) {
    let fromSegs: string[] | undefined;
    let toSegs: string[] | undefined;
    for (const [from, to] of Object.entries(options.mountRules)) {
      const f = splitSegments(from);
      if (f.length > (fromSegs?.length ?? 0) && f.every((seg, i) => resourcePath[i] === seg)) {
        fromSegs = f;
        toSegs = splitSegments(to);
      }
    }
    if (fromSegs && toSegs) resourcePath = [...toSegs, ...resourcePath.slice(fromSegs.length)];
  }

  return { ...target, resourcePath, action };
}

/**
 * Read a RAW OpenAPI spec from a file path or URL (YAML or JSON — NOT
 * dereferenced, so `$ref`s survive into named types) then convert it.
 */
export async function openapi2opensdkFromSource(
  source: string,
  options: OpenApi2OpenSdkOptions = {},
): Promise<OpensdkSpecJson> {
  let content: string;
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec from ${source}: ${res.statusText}`);
    content = await res.text();
  } else {
    const fs = await import('node:fs/promises');
    content = await fs.readFile(source, 'utf-8');
  }

  let doc: OpenAPIV3.Document;
  if (source.endsWith('.json') || content.trimStart().startsWith('{')) {
    doc = JSON.parse(content) as OpenAPIV3.Document;
  } else {
    const yaml = await import('js-yaml');
    doc = yaml.load(content) as OpenAPIV3.Document;
  }
  return openapi2opensdk(doc, options);
}
