import type { OpenAPIV3 } from 'openapi-types';
import type { SdkSecurity } from '@xyd-js/opensdk-core';

import { screamingSnakeCase } from './naming';

/** Map one OpenAPI securityScheme object into the OpenSDK security shape. */
export function mapSecurityScheme(value: unknown, schemeName?: string, envVar?: string): SdkSecurity | undefined {
  const scheme = value as OpenAPIV3.SecuritySchemeObject;
  if (!scheme || typeof scheme !== 'object' || !('type' in scheme)) return undefined;

  const entry: SdkSecurity = { type: scheme.type, kind: 'other' };
  if (schemeName) entry.schemeName = schemeName;
  if (envVar) entry.envVar = envVar;

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

  return entry;
}

/**
 * Map the document's `components.securitySchemes` to the OpenSDK security shape,
 * attaching a best-guess env var name a generated SDK reads the credential from.
 */
export function securitySchemes(doc: OpenAPIV3.Document, sdkName: string, authEnvVar?: string): SdkSecurity[] {
  const schemes = doc.components?.securitySchemes;
  if (!schemes) return [];

  const defaultEnv = authEnvVar || `${screamingSnakeCase(sdkName)}_API_KEY`;
  const out: SdkSecurity[] = [];

  for (const [schemeName, value] of Object.entries(schemes)) {
    const entry = mapSecurityScheme(value, schemeName, defaultEnv);
    if (entry) out.push(entry);
  }

  return out;
}

/**
 * Map a per-operation `security` requirement list through
 * `components.securitySchemes` into the OpenSDK shape. An empty input (an
 * explicitly public endpoint) maps to an empty list — distinct from "inherit
 * the document default", which is expressed by not setting Method.security.
 */
export function securityRequirements(
  doc: OpenAPIV3.Document,
  requirements: OpenAPIV3.SecurityRequirementObject[],
): SdkSecurity[] {
  const schemes = (doc.components?.securitySchemes ?? {}) as Record<string, unknown>;
  const out: SdkSecurity[] = [];
  for (const requirement of requirements) {
    for (const schemeName of Object.keys(requirement)) {
      const entry = mapSecurityScheme(schemes[schemeName], schemeName);
      if (entry) out.push(entry);
    }
  }
  return out;
}
