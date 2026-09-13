import type { NamedType, OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { nativeOpensdkGenerate } from './native';
import type { Emitter, EmitterContext, GeneratedFile, GeneratedFileEntry } from './types';

/**
 * Comment syntax for the ownership header, by file extension. Extensions the
 * orchestrator does not know (.json, .md, .mod, .sum, no extension, ...) never
 * get a header — comments would corrupt them or have no idiomatic syntax.
 */
const HEADER_COMMENT_BY_EXT: Record<string, string> = {
  '.go': '// ',
  '.ts': '// ',
  '.js': '// ',
  '.rs': '// ',
  '.py': '# ',
  '.rb': '# ',
  '.yaml': '# ',
  '.yml': '# ',
  '.sh': '# ',
};

/** The dot-extension of a rel path ('' for none/dotfiles), e.g. 'pkg/client.go' -> '.go'. */
function fileExtension(relPath: string): string {
  const base = relPath.slice(relPath.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot) : '';
}

/** Render the header text as a comment block for `relPath`, or null when the extension is unknown. */
function renderFileHeader(relPath: string, header: string): string | null {
  const prefix = HEADER_COMMENT_BY_EXT[fileExtension(relPath)];
  if (!prefix) return null;
  return header
    .split('\n')
    .map((line) => (line ? `${prefix}${line}` : prefix.trimEnd()))
    .join('\n');
}

/**
 * Prepend the rendered ownership header + one blank line, exactly once —
 * a file that already starts with the rendered header is left untouched.
 */
function withFileHeader(relPath: string, content: string, header: string | null): string {
  if (!header) return content;
  const rendered = renderFileHeader(relPath, header);
  if (!rendered || content.startsWith(rendered)) return content;
  return `${rendered}\n\n${content}`;
}

/**
 * Drive an emitter over an OpenSDK IR document and keep each file's write
 * semantics: build the context, call each capability method, apply the
 * emitter's ownership header (fileHeader), and assemble the virtual file map
 * as `Record<path, { content, writeMode? }>` for a writeMode-aware
 * writeProject.
 */
export function generateFileMap(
  spec: OpensdkSpecJson,
  emitter: Emitter,
  emitterOptions: Record<string, unknown> = {},
): Record<string, GeneratedFileEntry> {
  const types = new Map<string, NamedType>();
  for (const t of spec.types || []) types.set(t.name, t);
  const ctx: EmitterContext = { spec, types, emitterOptions };
  const header = emitter.fileHeader?.(ctx) ?? null;

  // Native fast path: byte-exact file CONTENT from the Rust emitter (crates/
  // xyd_opensdk_<lang> via @xyd-js/native), with per-file writeMode derived from
  // the emitter's own generateProject (its authority — no hardcoded table, no
  // drift). Native content already carries the baked ownership header (matches
  // goldens), so withFileHeader is intentionally NOT re-applied here.
  //
  // The native surface takes ONLY the spec, so it can't honor emitterOptions
  // (e.g. { tests: false }) — those still take the JS path.
  //
  // A spec carrying `sdk` behavior overrides no longer does. Every crate now
  // interpolates the resolved block instead of baking defaults, proven by the
  // `10.sdk-behavior` / `11.sdk-behavior-pagination` fixtures — golden trees
  // with every policy dimension set to a non-default value — passing in all
  // seven Rust parity suites. (Go was the last holdout: its runtime came from
  // static .go.txt templates hardcoding `Default: 2` and `autoPageDelay = 0`.)
  const nativeGen =
    Object.keys(emitterOptions).length === 0 ? nativeOpensdkGenerate(emitter.language) : null;
  if (nativeGen) {
    // The native surface now returns `{ content, writeMode? }` directly, so the
    // whole file map — content AND write semantics — comes from Rust. This used
    // to call the TypeScript generateProject purely to rebuild the writeMode
    // map, which is what kept the TS emitters load-bearing at XYD_NATIVE=1.
    return JSON.parse(nativeGen(JSON.stringify(spec))) as Record<string, GeneratedFileEntry>;
  }

  const files: Record<string, GeneratedFileEntry> = {};
  const add = (produced: GeneratedFile[], capability: string) => {
    for (const f of produced) {
      if (f.path in files) {
        throw new Error(`emitter "${emitter.language}": ${capability} re-emitted ${f.path}`);
      }
      files[f.path] = {
        content: withFileHeader(f.path, f.content, header),
        ...(f.writeMode ? { writeMode: f.writeMode } : {}),
      };
    }
  };

  add(emitter.generateProject(spec, ctx), 'generateProject');
  add(emitter.generateClient(spec, ctx), 'generateClient');
  add(emitter.generateTypes(spec.types || [], ctx), 'generateTypes');
  add(emitter.generateResources(spec.resources || [], ctx), 'generateResources');
  add(emitter.generateRuntime(spec, ctx), 'generateRuntime');
  if (emitter.generateTests) add(emitter.generateTests(spec, ctx), 'generateTests');
  return files;
}

/**
 * Drive an emitter over an OpenSDK IR document: same pipeline as
 * generateFileMap (context, capability methods, ownership header), flattened
 * to the historical `Record<path, contents>` contract. Note the flattening
 * drops per-file writeMode — writeMode-aware callers use generateFileMap.
 */
export function generate(
  spec: OpensdkSpecJson,
  emitter: Emitter,
  emitterOptions: Record<string, unknown> = {},
): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [path, entry] of Object.entries(generateFileMap(spec, emitter, emitterOptions))) {
    files[path] = entry.content;
  }
  return files;
}
