import type { OpenAPIV3 } from 'openapi-types';
import type { XOpenApiSecurity } from '@xyd-js/opencli';

import { screamingSnakeCase } from './naming';

/**
 * Map the document's `components.securitySchemes` to the OpenCLI `x-openapi`
 * security shape, attaching a best-guess env var name a generated CLI reads
 * the credential from.
 */
export function securitySchemesToXOpenApi(
  doc: OpenAPIV3.Document,
  cliName: string,
  authEnvVar?: string,
): XOpenApiSecurity[] {
  const schemes = doc.components?.securitySchemes;
  if (!schemes) return [];

  const defaultEnv = authEnvVar || `${screamingSnakeCase(cliName)}_API_KEY`;
  const out: XOpenApiSecurity[] = [];

  for (const value of Object.values(schemes)) {
    const scheme = value as OpenAPIV3.SecuritySchemeObject;
    if (!scheme || typeof scheme !== 'object' || !('type' in scheme)) continue;

    const entry: XOpenApiSecurity = { type: scheme.type, kind: 'other', envVar: defaultEnv };

    if (scheme.type === 'http') {
      entry.scheme = scheme.scheme;
      if ('bearerFormat' in scheme && scheme.bearerFormat) entry.bearerFormat = scheme.bearerFormat;
      const s = (scheme.scheme || '').toLowerCase();
      entry.kind = s === 'basic' ? 'basic' : 'bearer';
    } else if (scheme.type === 'apiKey') {
      entry.in = scheme.in;
      entry.name = scheme.name;
      entry.kind = scheme.in === 'query' ? 'apiKey-query' : scheme.in === 'cookie' ? 'apiKey-cookie' : 'apiKey-header';
    }

    out.push(entry);
  }

  return out;
}
