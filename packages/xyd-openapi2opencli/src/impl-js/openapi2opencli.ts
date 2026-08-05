import type { OpenAPIV3 } from 'openapi-types';
import type { CliInfo, Contact, License, OpencliSpecJson, XOpenApiRoot } from '@xyd-js/opencli';
import { deferencedOpenAPI } from '@xyd-js/openapi';

import { buildLeafCommand } from './command';
import { slug } from './naming';
import { securitySchemesToXOpenApi } from './security';
import { CommandTree } from './tree';
import type { OpenApi2OpenCliOptions } from './types';

// Mirrors SUPPORTED_HTTP_METHODS in @xyd-js/openapi (kept local to avoid a
// brittle value import across the dist boundary).
const DEFAULT_HTTP_METHODS: string[] = ['get', 'put', 'patch', 'post', 'delete'];

function buildInfo(doc: OpenAPIV3.Document, cliName: string, version: string): CliInfo {
  const info: CliInfo = { title: cliName, version };
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

function buildXOpenApiRoot(doc: OpenAPIV3.Document, cliName: string, options: OpenApi2OpenCliOptions): XOpenApiRoot | undefined {
  const servers = (doc.servers || []).map((s) => s.url).filter(Boolean);
  const security = securitySchemesToXOpenApi(doc, cliName, options.authEnvVar);

  const root: XOpenApiRoot = {};
  if (servers.length) root.servers = servers;
  if (security.length) root.security = security;
  return Object.keys(root).length ? root : undefined;
}

/**
 * Convert a (dereferenced) OpenAPI 3.x document into an OpenCLI document,
 * embedding the `x-openapi` request binding on the root and on every command.
 *
 * Pure and synchronous — pass an already-dereferenced document
 * (see {@link openapi2opencliFromSource} for the file/URL convenience).
 */
export function openapi2opencli(doc: OpenAPIV3.Document, options: OpenApi2OpenCliOptions = {}): OpencliSpecJson {
  const cliName = options.cliName ?? (slug(doc.info?.title || 'cli') || 'cli');
  const version = options.version ?? doc.info?.version ?? '0.0.0';
  const methods = (options.includeMethods ?? DEFAULT_HTTP_METHODS).map((m) => m.toLowerCase());

  const spec: OpencliSpecJson = {
    opencli: '1.0.0',
    info: buildInfo(doc, cliName, version),
  };

  const xRoot = buildXOpenApiRoot(doc, cliName, options);
  if (xRoot) spec['x-openapi'] = xRoot;

  const tree = new CommandTree();
  const paths = doc.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;
    if (options.includePaths && !options.includePaths.some((p) => path.startsWith(p))) continue;

    const pathItemParams = ((pathItem as OpenAPIV3.PathItemObject).parameters || []) as OpenAPIV3.ParameterObject[];

    for (const method of methods) {
      const operation = (pathItem as Record<string, unknown>)[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation || typeof operation !== 'object') continue;

      const { resourcePath, command } = buildLeafCommand(method, path, operation, pathItemParams, options);
      tree.insert(resourcePath, command);
    }
  }

  const commands = tree.emit();
  if (commands.length) spec.commands = commands;

  return spec;
}

/**
 * Read + dereference an OpenAPI spec from a file path or URL (via @xyd-js/openapi)
 * then convert it to an OpenCLI document.
 */
export async function openapi2opencliFromSource(
  source: string,
  options: OpenApi2OpenCliOptions = {},
): Promise<OpencliSpecJson> {
  const doc = await deferencedOpenAPI(source);
  if (!doc) throw new Error(`Failed to load OpenAPI spec from ${source}`);
  return openapi2opencli(doc, options);
}
