import * as fs from 'node:fs';

import { embedXSdk } from '@xyd-js/opensdk-uniform';
import type { OpenAPIV3 } from 'openapi-types';

// `opensdk xsdk`: the CI/CD-side spec enricher. Reads a RAW OpenAPI spec,
// computes every operation's per-language SDK artifacts (signature, usage
// sample, request/response type reference) via the OpenSDK emitters, and
// writes the spec back with `x-sdk` extensions embedded (root + per
// operation). Ship the result as your published OpenAPI — any xyd docs site
// then renders SDK-native docs from it WITHOUT running the generator (parity
// with how `x-docs` carries routing/sidebar in the spec itself).

export interface XsdkCommandOptions {
  /** OpenAPI spec path or URL (yaml/json). */
  spec: string;
  /** Write the enriched spec to a file; default stdout. Extension picks the format. */
  output?: string;
  /** Restrict to a subset of SDK language ids (default: all six). */
  langs?: string[];
}

async function readSource(source: string): Promise<{ content: string; json: boolean }> {
  let content: string;
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec from ${source}: ${res.statusText}`);
    content = await res.text();
  } else {
    content = fs.readFileSync(source, 'utf-8');
  }
  return { content, json: source.endsWith('.json') || content.trimStart().startsWith('{') };
}

async function serialize(doc: OpenAPIV3.Document, asJson: boolean): Promise<string> {
  if (asJson) return `${JSON.stringify(doc, null, 2)}\n`;
  const yaml = await import('js-yaml');
  // noRefs: the raw doc's repeated $ref objects must stay inline `$ref` maps,
  // never yaml anchors; unlimited line width keeps usage samples readable.
  return yaml.dump(doc, { noRefs: true, lineWidth: -1 });
}

export async function xsdkCommand(opts: XsdkCommandOptions): Promise<void> {
  const { content, json } = await readSource(opts.spec);

  let doc: OpenAPIV3.Document;
  if (json) {
    doc = JSON.parse(content) as OpenAPIV3.Document;
  } else {
    const yaml = await import('js-yaml');
    doc = yaml.load(content) as OpenAPIV3.Document;
  }

  const { doc: enriched, operations, languages } = embedXSdk(doc, { langs: opts.langs });

  const outJson = opts.output ? opts.output.endsWith('.json') : json;
  const out = await serialize(enriched, outJson);

  if (opts.output) {
    fs.writeFileSync(opts.output, out);
    console.log(`[xsdk] embedded ${languages.join(', ')} for ${operations} operation(s) → ${opts.output}`);
  } else {
    process.stdout.write(out);
  }
}
