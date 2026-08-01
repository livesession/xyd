import fs from 'node:fs';
import { type IncomingHttpHeaders, type Server, createServer } from 'node:http';
import path from 'node:path';

import type { Method, NamedType, OpensdkSpecJson, Resource } from '@xyd-js/opensdk-core';

import { type LeafMethod, firstMethod } from './spec';

// Language-agnostic e2e primitives: merge the committed per-method IRs into
// one full SDK IR, compute the request a correct SDK must send, record what a
// generated SDK actually sent, and diff the two. The language-specific part
// (building + driving the generated SDK) lives in each emitter package.

export interface RecordedRequest {
  method: string;
  path: string;
  query: string[];
  contentType?: string;
  bodyFields: string[];
  auth: string;
}

export interface RecordedFixture {
  call: string; // the driver key, e.g. "Chat.Completions.New"
  request: RecordedRequest;
}

/** The request a correct SDK sends for a minimal call (path args + required-only params). */
export function expectedRequest(spec: OpensdkSpecJson, method: Method): RecordedRequest {
  const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
  // Empty params struct -> required body fields marshal; optionals omitted.
  const bodyFields: string[] = [];
  const bodyRef = method.requestBody?.type;
  if (bodyRef?.kind === 'ref' && bodyRef.name) {
    for (const f of types.get(bodyRef.name)?.fields || []) if (f.required) bodyFields.push(f.name);
  }
  // Required query params marshal too — bound by the raw HTTP wire name
  // (`Param.name` is only the identifier-safe name; `ids` may ride as `ids[]`).
  const query = (method.queryParams || [])
    .filter((q) => q.required)
    .map((q) => q.wireName ?? q.name)
    .sort();
  const kind = spec.security?.[0]?.kind || method.security?.[0]?.kind || 'bearer';
  const req: RecordedRequest = {
    method: String(method.httpMethod || 'get').toLowerCase(),
    path: method.path || '',
    query,
    bodyFields: bodyFields.sort(),
    auth: kind.startsWith('apiKey') ? 'apikey' : kind,
  };
  if (method.requestBody) req.contentType = 'application/json';
  return req;
}

/** Merge per-method resource trees; methods dedupe by ACTION (two spec ops can share one). */
export function mergeResources(target: Resource[], source: Resource[]): void {
  for (const s of source) {
    let e = target.find((t) => t.name === s.name);
    if (!e) {
      e = { name: s.name, description: s.description, resources: [], methods: [] };
      target.push(e);
    }
    for (const m of s.methods || []) {
      if (!(e.methods || []).some((x) => x.action === m.action)) {
        (e.methods = e.methods || []).push(m);
      }
    }
    if (s.resources?.length) mergeResources((e.resources = e.resources || []), s.resources);
  }
}

export interface PerMethodFixture {
  slug: string;
  ir: OpensdkSpecJson;
  leaf: LeafMethod;
}

/** Load every committed per-method IR fixture (`<slug>/input.json`). */
export function loadPerMethod(fixturesDir: string): PerMethodFixture[] {
  if (!fs.existsSync(fixturesDir)) return [];
  const out: PerMethodFixture[] = [];
  for (const slug of fs.readdirSync(fixturesDir).sort()) {
    const inPath = path.join(fixturesDir, slug, 'input.json');
    if (!fs.existsSync(inPath)) continue;
    const ir = JSON.parse(fs.readFileSync(inPath, 'utf8')) as OpensdkSpecJson;
    const leaf = firstMethod(ir.resources);
    if (leaf) out.push({ slug, ir, leaf });
  }
  return out;
}

/** Assemble the full OpenSDK IR by merging the committed per-method IRs. */
export function fullIR(fixturesDir: string, sdkName: string): OpensdkSpecJson {
  const methods = loadPerMethod(fixturesDir);
  const first = methods[0]?.ir;
  const root: OpensdkSpecJson = {
    opensdk: first?.opensdk || '1.0.0',
    info: first?.info || { title: sdkName, version: '1.0.0' },
    servers: first?.servers,
    security: first?.security,
    types: [],
    resources: [],
  };
  const typeByName = new Map<string, NamedType>();
  for (const m of methods) {
    for (const t of m.ir.types || []) if (!typeByName.has(t.name)) typeByName.set(t.name, t);
    mergeResources(root.resources as Resource[], m.ir.resources || []);
  }
  root.types = [...typeByName.values()];
  return root;
}

/** An in-process HTTP server recording the last request a generated SDK made. */
export class RecordingServer {
  private server: Server;
  port = 0;
  last: { method: string; url: string; headers: IncomingHttpHeaders; body: string } | null = null;

  constructor() {
    this.server = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => {
        body += c;
      });
      req.on('end', () => {
        this.last = { method: req.method || '', url: req.url || '', headers: req.headers, body };
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{"ok":true}');
      });
    });
  }

  start(): Promise<void> {
    return new Promise((r) =>
      this.server.listen(0, '127.0.0.1', () => {
        this.port = (this.server.address() as { port: number }).port;
        r();
      }),
    );
  }

  stop() {
    this.server.close();
  }
}

/**
 * The field names a request body carries, across the content types an SDK emits:
 * JSON (object keys), `multipart/form-data` (each part's `name="…"`), and
 * `x-www-form-urlencoded` (the form keys). Multipart matters for file uploads —
 * without it those ops look like they sent an empty body.
 */
function bodyFieldNames(body: string, contentType: string): string[] {
  const ct = contentType.toLowerCase();
  if (ct.includes('multipart/form-data')) {
    // Part headers are ASCII and precede any binary payload, so a regex over the
    // raw body reliably lifts the part names even when file bytes follow.
    const names = new Set<string>();
    const re = /content-disposition:\s*form-data;[^\r\n]*\bname="([^"]*)"/gi;
    let m: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
    while ((m = re.exec(body)) !== null) names.add(m[1]);
    return [...names].sort();
  }
  if (ct.includes('x-www-form-urlencoded')) {
    try {
      return [...new URLSearchParams(body).keys()].sort();
    } catch {
      return [];
    }
  }
  try {
    const parsed = body ? JSON.parse(body) : {};
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).sort();
  } catch {
    /* non-JSON body */
  }
  return [];
}

/** Reduce a raw recorded request to the comparable shape. */
export function normalizeRecorded(raw: NonNullable<RecordingServer['last']>): RecordedRequest {
  const [p, qs] = (raw.url || '').split('?');
  const query = qs ? [...new URLSearchParams(qs).keys()].sort() : [];
  const contentType = (raw.headers['content-type'] as string) || '';
  const bodyFields = bodyFieldNames(raw.body, contentType);
  const authHeader = (raw.headers.authorization as string) || '';
  const auth = authHeader.startsWith('Bearer ') ? 'bearer' : authHeader ? 'apikey' : '';
  return {
    method: (raw.method || '').toLowerCase(),
    path: p,
    query,
    bodyFields,
    auth,
    contentType: contentType.split(';')[0] || undefined,
  };
}

/** Human-readable differences between an actual request and the recorded fixture. */
export function diffRequest(actual: RecordedRequest, fixture: RecordedRequest): string[] {
  const errs: string[] = [];
  if (actual.method !== fixture.method) errs.push(`method ${actual.method} != ${fixture.method}`);
  const re = new RegExp(`^${fixture.path.replace(/[.]/g, '\\.').replace(/\{[^}]+\}/g, '[^/]+')}$`);
  if (!re.test(actual.path)) errs.push(`path ${actual.path} !~ ${fixture.path}`);
  if (actual.query.join(',') !== fixture.query.join(',')) errs.push(`query [${actual.query}] != [${fixture.query}]`);
  for (const f of fixture.bodyFields) if (!actual.bodyFields.includes(f)) errs.push(`body missing ${f}`);
  if (actual.auth !== fixture.auth) errs.push(`auth ${actual.auth} != ${fixture.auth}`);
  return errs;
}
