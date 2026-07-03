import fs from 'node:fs';
import * as path from 'node:path';

import type { ChainJson } from '@xyd-js/opensdk-core';

/** chain.json filenames tried (in order) when no explicit path is given. */
const CHAIN_NAMES = ['chain.json', path.join('.chain', 'chain.json')];

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Locate a chain file: an explicit path (must exist) or the conventional names in cwd. */
export function detectChain(cwd: string = process.cwd(), explicitPath?: string): string | null {
  if (explicitPath) {
    const resolved = path.resolve(cwd, explicitPath);
    return fs.existsSync(resolved) ? resolved : null;
  }
  for (const rel of CHAIN_NAMES) {
    const resolved = path.resolve(cwd, rel);
    if (fs.existsSync(resolved)) return resolved;
  }
  return null;
}

/** Load + validate a chain.json (json, or yaml by extension). Throws on a bad shape or a dangling source ref. */
export async function resolveChain(chainPath: string, cwd: string = process.cwd()): Promise<ChainJson> {
  const abs = path.resolve(cwd, chainPath);
  if (!fs.existsSync(abs)) throw new Error(`Chain file not found: ${abs}`);
  const raw = fs.readFileSync(abs, 'utf8');
  let doc: ChainJson;
  try {
    if (abs.endsWith('.yaml') || abs.endsWith('.yml')) {
      const yaml = await import('js-yaml');
      doc = yaml.load(raw) as ChainJson;
    } else {
      doc = JSON.parse(raw) as ChainJson;
    }
  } catch (err) {
    throw new Error(`Failed to parse ${abs}: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!isObject(doc)) throw new Error(`Invalid chain file ${abs}: expected an object`);
  if (!isObject(doc.sources) || Object.keys(doc.sources).length === 0) {
    throw new Error('chain.json needs at least one `sources` entry');
  }
  if (!isObject(doc.targets) || Object.keys(doc.targets).length === 0) {
    throw new Error('chain.json needs at least one `targets` entry');
  }
  for (const [name, t] of Object.entries(doc.targets)) {
    if (!t?.target) throw new Error(`target "${name}" is missing \`target\` (the language)`);
    if (!t?.source) throw new Error(`target "${name}" is missing \`source\``);
    if (!doc.sources[t.source]) {
      throw new Error(`target "${name}" references unknown source "${t.source}" (declare it under \`sources\`)`);
    }
  }
  return doc;
}
