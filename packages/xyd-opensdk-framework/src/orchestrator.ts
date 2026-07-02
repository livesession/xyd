import type { NamedType, OpensdkSpecJson } from '@xyd-js/opensdk-core';

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
