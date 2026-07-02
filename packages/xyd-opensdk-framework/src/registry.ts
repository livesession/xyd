import type { Emitter, OpensdkConfig } from './types';

const emitters = new Map<string, Emitter>();

/**
 * Human-friendly language names mapped to the canonical emitter id. Lets config
 * files and `--lang` use `typescript`/`csharp`/… instead of the internal
 * `node`/`dotnet` registry keys. Canonical ids map to themselves; anything not
 * listed passes through unchanged (so unknown ids still fail at getEmitter).
 */
export const languageAliases: Record<string, string> = {
  typescript: 'node',
  ts: 'node',
  node: 'node',
  javascript: 'node',
  js: 'node',
  go: 'go',
  golang: 'go',
  python: 'python',
  py: 'python',
  ruby: 'ruby',
  rb: 'ruby',
  java: 'java',
  csharp: 'dotnet',
  'c#': 'dotnet',
  cs: 'dotnet',
  dotnet: 'dotnet',
  '.net': 'dotnet',
};

/** Resolve a language alias to its canonical emitter id (unknown passes through). */
export function resolveLanguage(input: string): string {
  const key = input.toLowerCase();
  return languageAliases[key] ?? key;
}

/** Register a language emitter plugin (keyed by `emitter.language`). */
export function registerEmitter(emitter: Emitter): void {
  emitters.set(emitter.language, emitter);
}

/** Look up a registered emitter by id or alias; throws with the available set when unknown. */
export function getEmitter(language: string): Emitter {
  const emitter = emitters.get(resolveLanguage(language));
  if (!emitter) {
    const available = [...emitters.keys()].join(', ') || '(none)';
    throw new Error(`Unknown opensdk language: ${language}. Available: ${available}`);
  }
  return emitter;
}

/** Apply a plugin bundle (register every emitter it ships). */
export function applyConfig(config: OpensdkConfig): void {
  for (const emitter of config.emitters ?? []) registerEmitter(emitter);
}
