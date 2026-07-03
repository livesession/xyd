import type { ExampleValue } from '@xyd-js/opensdk-framework';

import { propKey } from './model';

// Renders the framework's language-neutral ExampleValue tree into a TypeScript
// literal, for the generated test suite (generateTests). The shared planner
// (planExample / planMethodExample) decides WHAT a realistic example is; this
// module only decides how TypeScript spells it — so every emitter's test suite
// exercises byte-identical shapes and can never drift.

/**
 * Render one ExampleValue as a TypeScript literal expression. Object/map render
 * as object literals keyed by the WIRE field name (params objects and request
 * bodies keep wire keys); enums/consts render as their raw wire value.
 */
export function renderNodeExample(value: ExampleValue): string {
  switch (value.kind) {
    case 'string':
      return JSON.stringify(value.value);
    case 'integer':
      return String(value.value);
    case 'number':
      return String(value.value);
    case 'boolean':
      return value.value ? 'true' : 'false';
    case 'null':
      return 'null';
    case 'binary':
      return 'new Uint8Array([1, 2, 3])';
    case 'enum':
      return tsLiteral(value.value);
    case 'const':
      return tsLiteral(value.value);
    case 'array':
      return `[${renderNodeExample(value.item)}]`;
    case 'map':
      return `{ key: ${renderNodeExample(value.value)} }`;
    case 'object':
      // A depth-capped / cycle-guarded struct yields no fields; a bare `{}` fails
      // to type-check against a variant that requires properties, so cast it opaque.
      return value.fields.length === 0
        ? '{} as any'
        : `{ ${value.fields.map((f) => `${propKey(f.name)}: ${renderNodeExample(f.value)}`).join(', ')} }`;
    case 'union':
      return renderNodeExample(value.variant);
    default:
      // 'any' (incl. the planner's depth-cap bottom): opaque so it satisfies ANY
      // strictly-typed field (a string-literal union, an enum, a named struct).
      return '{} as any';
  }
}

/** A JSON scalar (enum/const wire value) as a TypeScript literal. */
function tsLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return JSON.stringify(String(v));
}
