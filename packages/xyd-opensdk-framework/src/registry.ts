import type { Emitter, OpensdkConfig } from './types';

const emitters = new Map<string, Emitter>();

/** Register a language emitter plugin (keyed by `emitter.language`). */
export function registerEmitter(emitter: Emitter): void {
  emitters.set(emitter.language, emitter);
}

/** Look up a registered emitter; throws with the available set when unknown. */
export function getEmitter(language: string): Emitter {
  const emitter = emitters.get(language);
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
