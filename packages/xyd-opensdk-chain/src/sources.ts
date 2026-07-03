import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import { JSONPath } from 'jsonpath-plus';

import type { ChainSource } from '@xyd-js/opensdk-core';

// The chain SOURCES engine: turn a source's `inputs` (+ optional `overlays`) into
// ONE processed OpenAPI spec that a target generates from. Everything operates on
// the RAW doc (never dereferenced) so `$ref`s survive into the converter, which
// walks the un-dereferenced document.

type Doc = Record<string, unknown>;

/** Read + parse an OpenAPI/overlay doc from a file path or URL (json or yaml). No dereferencing. */
export async function readRawDoc(location: string, cwd: string = process.cwd()): Promise<Doc> {
  let content: string;
  if (location.startsWith('http://') || location.startsWith('https://')) {
    const res = await fetch(location);
    if (!res.ok) throw new Error(`Failed to fetch ${location}: ${res.status} ${res.statusText}`);
    content = await res.text();
  } else {
    content = fs.readFileSync(path.resolve(cwd, location), 'utf8');
  }
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // strip a leading BOM so JSON.parse won't choke
  // Prefer the extension; only sniff when there's none (e.g. a URL). A .yaml that
  // starts with a `{` flow-mapping must NOT be routed to JSON.parse.
  const trimmed = content.trimStart();
  const isYaml = location.endsWith('.yaml') || location.endsWith('.yml');
  if (!isYaml && (location.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return JSON.parse(content) as Doc;
  }
  const yaml = await import('js-yaml');
  return yaml.load(content) as Doc;
}

/** Serialize a processed doc by output extension (yaml for .yaml/.yml, else json). */
export function serializeDoc(doc: Doc, outPath: string): string {
  return /\.ya?ml$/.test(outPath) ? yamlDump(doc) : `${JSON.stringify(doc, null, 2)}\n`;
}

let _yaml: typeof import('js-yaml') | undefined;
function yamlDump(doc: Doc): string {
  // yaml output is rare (only when a source's `output` ends in .yaml); load lazily.
  if (!_yaml) throw new Error('yaml output requires js-yaml; use a .json `output` or preload it');
  return _yaml.dump(doc);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (isObject(a) && isObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

/** Deep-merge `source` into `target` in place (objects merge; arrays + scalars replace). */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(source)) {
    if (isObject(v) && isObject(target[k])) deepMerge(target[k] as Record<string, unknown>, v);
    else target[k] = v;
  }
}

const OPERATION_KEYS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

/**
 * Merge several raw OpenAPI docs into one. `openapi`/`info`/`servers` come from the
 * first. `paths` union at OPERATION granularity (two inputs can split methods of the
 * SAME path — e.g. GET in one file, POST in another); a path present in both with the
 * SAME method defined differently is a real conflict. Every `components.*` bucket is
 * unioned (differing content = conflict; identical = deduped); `tags` dedup by name;
 * `security` concatenated + deduped. Conflict messages name the actual pair of inputs.
 * Never mutates the input docs.
 */
export function mergeOpenApiDocs(docs: Doc[]): Doc {
  if (docs.length === 0) throw new Error('mergeOpenApiDocs: no inputs');
  const merged: Doc = { ...docs[0] };
  merged.paths = { ...((docs[0].paths as Doc) ?? {}) };
  merged.components = structuredClone((docs[0].components as Doc) ?? {});
  merged.tags = [...((docs[0].tags as unknown[]) ?? [])];
  if (Array.isArray(docs[0].security)) merged.security = [...(docs[0].security as unknown[])];

  // Which input first contributed each path/component (so a conflict names the RIGHT pair).
  const pathOrigin = new Map<string, number>(Object.keys(merged.paths as Doc).map((p) => [p, 0]));
  const compOrigin = new Map<string, number>();
  for (const [bucket, entries] of Object.entries(merged.components as Doc)) {
    if (isObject(entries)) for (const name of Object.keys(entries)) compOrigin.set(`${bucket}.${name}`, 0);
  }

  for (let i = 1; i < docs.length; i++) {
    const doc = docs[i];
    // paths — union at operation granularity
    for (const [p, item] of Object.entries((doc.paths as Doc) ?? {})) {
      const existing = (merged.paths as Doc)[p];
      if (existing === undefined) {
        (merged.paths as Doc)[p] = item;
        pathOrigin.set(p, i);
      } else if (isObject(existing) && isObject(item)) {
        const mergedItem: Doc = { ...existing }; // clone — never mutate docs[0]'s PathItem
        for (const [k, v] of Object.entries(item)) {
          if (mergedItem[k] === undefined) mergedItem[k] = v;
          else if (!deepEqual(mergedItem[k], v)) {
            const what = OPERATION_KEYS.has(k) ? `method "${k.toUpperCase()}"` : `field "${k}"`;
            throw new Error(`Merge conflict: path "${p}" ${what} differs in inputs[${pathOrigin.get(p)}] and inputs[${i}]`);
          }
        }
        (merged.paths as Doc)[p] = mergedItem;
      } else if (!deepEqual(existing, item)) {
        throw new Error(`Merge conflict: path "${p}" differs in inputs[${pathOrigin.get(p)}] and inputs[${i}]`);
      }
    }
    // components.* — per-bucket union, conflict on differing content
    for (const [bucket, entries] of Object.entries((doc.components as Doc) ?? {})) {
      if (!isObject(entries)) continue;
      const target = ((merged.components as Doc)[bucket] as Doc) ?? ((merged.components as Doc)[bucket] = {});
      for (const [name, def] of Object.entries(entries)) {
        const key = `${bucket}.${name}`;
        if (target[name] !== undefined && !deepEqual(target[name], def)) {
          throw new Error(`Merge conflict: components.${bucket}.${name} differs in inputs[${compOrigin.get(key)}] and inputs[${i}]`);
        }
        if (target[name] === undefined) compOrigin.set(key, i);
        target[name] = def;
      }
    }
    // tags — dedup by name
    const tags = merged.tags as { name?: string }[];
    for (const tag of (doc.tags as { name?: string }[]) ?? []) {
      if (!tags.some((t) => t.name === tag.name)) tags.push(tag);
    }
    // security — concat + dedup (on a clone; never mutate docs[0])
    if (Array.isArray(doc.security)) {
      const sec = (merged.security as unknown[]) ?? (merged.security = []);
      for (const req of doc.security) if (!sec.some((s) => deepEqual(s, req))) sec.push(req);
    }
  }
  return merged;
}

interface OverlayAction {
  target: string;
  update?: unknown;
  remove?: boolean;
  description?: string;
}

/**
 * Apply an OpenAPI Overlay 1.0.0 doc to a raw spec (in place). Each action's
 * JSONPath `target` selects nodes; `remove: true` deletes them, otherwise `update`
 * is deep-merged into each matched node.
 */
export function applyOverlay(doc: Doc, overlay: Doc): Doc {
  const version = String(overlay.overlay ?? '');
  if (version !== '1.0.0') {
    throw new Error(`Unsupported overlay version "${version}" (expected "1.0.0")`);
  }
  const actions = (overlay.actions as OverlayAction[]) ?? [];
  for (const action of actions) {
    if (!action.target) throw new Error('Overlay action is missing a `target` JSONPath');
    const matches = JSONPath({ path: action.target, json: doc, resultType: 'all' }) as {
      value: unknown;
      parent: unknown;
      parentProperty: string;
    }[];
    if (action.remove) {
      // Remove in reverse so array splices don't shift later indices.
      for (const m of [...matches].reverse()) {
        if (m.parent == null || m.parentProperty == null) continue;
        if (Array.isArray(m.parent)) m.parent.splice(Number(m.parentProperty), 1);
        else delete (m.parent as Record<string, unknown>)[m.parentProperty];
      }
    } else if (action.update !== undefined) {
      for (const m of matches) {
        if (isObject(m.value) && isObject(action.update)) deepMerge(m.value, action.update);
        else if (m.parent != null && m.parentProperty != null) {
          (m.parent as Record<string, unknown>)[m.parentProperty] = action.update;
        }
      }
    }
  }
  return doc;
}

/**
 * Process one chain source: read its `inputs` (merged when >1), apply `overlays`
 * in order, then write the processed raw spec to `output` (or a temp file) and
 * return that path. Targets generate from this path.
 */
export async function processSource(source: ChainSource, cwd: string = process.cwd()): Promise<string> {
  if (!source.inputs?.length) throw new Error('chain source has no `inputs`');
  const docs = await Promise.all(source.inputs.map((i) => readRawDoc(i.location, cwd)));
  let doc = docs.length > 1 ? mergeOpenApiDocs(docs) : docs[0];
  for (const ov of source.overlays ?? []) doc = applyOverlay(doc, await readRawDoc(ov.location, cwd));

  const outPath = source.output
    ? path.resolve(cwd, source.output)
    : path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-chain-src-')), 'openapi.json');
  if (/\.ya?ml$/.test(outPath)) _yaml = await import('js-yaml'); // ensure the dumper is loaded
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, serializeDoc(doc, outPath));
  return outPath;
}
