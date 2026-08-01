import fs from 'node:fs';
import path from 'node:path';

import type { Method, OpensdkSpecJson } from '@xyd-js/opensdk-core';
import { walkMethods } from '@xyd-js/opensdk-core';

// Corpus discovery so the emitter test suites are not hardcoded to one API.
// A "complex corpus" is a committed set of per-method IR fixtures for a whole real
// API, named `<order>.complex.<name>` under a package's `__fixtures__/` (e.g.
// `-2.complex.openai`), with a sibling whole-SDK golden `<order>.complex.<name>.full`.
// Every offline test tier (docs regen guard, full-sdk golden, e2e request binding,
// usage snippets, publish) discovers these and loops — adding another complex API
// (stripe, github, …) is just dropping its fixtures, no test-code change.

export interface ComplexCorpus {
  /** The API name — the segment after `complex.` (e.g. `openai`). Also used as the SDK name. */
  name: string;
  /** The fixtures directory name (e.g. `-2.complex.openai`). */
  slug: string;
  /** Absolute path to the per-method fixtures dir (`<slug>/<op>/input.json`). */
  dir: string;
  /** Absolute path to the whole-SDK golden output dir (`<slug>.full/output`; may not exist yet). */
  fullOut: string;
}

/** Discover every `<order>.complex.<name>` per-method corpus under a `__fixtures__` dir. */
export function listComplexCorpora(fixturesDir: string): ComplexCorpus[] {
  if (!fs.existsSync(fixturesDir)) return [];
  const out: ComplexCorpus[] = [];
  for (const entry of fs.readdirSync(fixturesDir).sort()) {
    // `<order>.complex.<name>` but NOT its `.full` golden sibling (name is dotless).
    const m = entry.match(/\.complex\.([^.]+)$/);
    if (!m) continue;
    const dir = path.join(fixturesDir, entry);
    if (!fs.statSync(dir).isDirectory()) continue;
    out.push({ name: m[1], slug: entry, dir, fullOut: path.join(fixturesDir, `${entry}.full`, 'output') });
  }
  return out;
}

export interface RepresentativeMethod {
  /** The request shape this op represents. */
  label: string;
  /** The resource chain (client access path), e.g. `['batches']`. */
  chain: string[];
  method: Method;
}

/**
 * One method per request shape (body-post, query-list, path-get, pagination),
 * picked GENERICALLY from an IR so per-op tests (usage snippets) work on any
 * corpus without hardcoding API-specific operation names. Shapes with no match in
 * the corpus are omitted.
 */
export function representativeMethods(ir: OpensdkSpecJson): RepresentativeMethod[] {
  const all = walkMethods(ir);
  const out: RepresentativeMethod[] = [];
  const seen = new Set<string>();
  const http = (m: Method) => String(m.httpMethod || '').toLowerCase();
  const pick = (label: string, pred: (m: Method) => boolean) => {
    const f = all.find((x) => pred(x.method) && !seen.has(x.path.join('.') + x.method.action));
    if (f) {
      seen.add(f.path.join('.') + f.method.action);
      out.push({ label, chain: f.path, method: f.method });
    }
  };
  pick('body-post', (m) => http(m) === 'post' && !!m.requestBody);
  pick('query-list', (m) => http(m) === 'get' && (m.queryParams?.length ?? 0) > 0 && !m.pagination);
  pick('path-get', (m) => http(m) === 'get' && (m.pathParams?.length ?? 0) > 0);
  pick('pagination', (m) => !!m.pagination);
  return out;
}

// The registry of "complex corpus" SOURCE specs — the vendored real-API OpenAPI
// documents each emitter regenerates its per-method fixtures from (docs.test.ts,
// gated O2S_BUILD_DOCS). This is TEST-ONLY config, so it lives here in the test
// harness (not in a production package). Only the REGEN path needs a source spec;
// every offline tier discovers the committed fixtures by convention via
// `listComplexCorpora`, so a corpus whose fixtures are already committed needs no
// entry here. The `specFile`/`groupingFile` are resolved by the consuming test
// against the converter's vendored `oracle/` dir (gitignored/encrypted).

export interface CorpusSpec {
  /** The API name — matches the `<order>.complex.<name>` fixtures dir. */
  name: string;
  /** The fixtures directory name (e.g. `-2.complex.openai`). */
  slug: string;
  /** The generated SDK's name. */
  sdkName: string;
  /** Source OpenAPI spec filename, relative to the converter's `oracle/` dir. */
  specFile: string;
  /** Optional mount/operation grouping JSON filename, relative to `oracle/`. */
  groupingFile?: string;
}

export const CORPUS_SPECS: CorpusSpec[] = [
  {
    name: 'openai',
    slug: '-2.complex.openai',
    sdkName: 'openai',
    specFile: 'openai-openapi.yaml',
    groupingFile: 'openai-grouping.json',
  },
];
