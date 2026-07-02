import type { ExampleValue } from '@xyd-js/opensdk-framework';

// Renders the framework's language-neutral ExampleValue tree into a Ruby literal
// for the generated test suite (generateTests). The shared planner (planExample
// / planMethodExample) decides WHAT a realistic example is; this module only
// decides how Ruby spells it — so the Go, Python and Ruby test suites exercise
// byte-identical shapes and can never drift.

/**
 * Render one ExampleValue as a Ruby literal expression. Object/map render as
 * Hash literals keyed by the WIRE field name (our kwargs and request bodies
 * accept plain Hashes, which the transport encodes); enums render as their raw
 * wire value (the transport encodes an enum member and its bare value
 * identically, and this keeps the test import-free of the model symbol); a
 * binary field is a StringIO so the multipart encoder writes it as a file part.
 */
export function renderRbExample(value: ExampleValue): string {
  switch (value.kind) {
    case 'string':
      return rbStr(value.value);
    case 'integer':
      return String(value.value);
    case 'number':
      return String(value.value);
    case 'boolean':
      return value.value ? 'true' : 'false';
    case 'null':
      return 'nil';
    case 'binary':
      return 'StringIO.new("Example data")';
    case 'enum':
      return rbLiteral(value.value);
    case 'const':
      return rbLiteral(value.value);
    case 'array':
      return `[${renderRbExample(value.item)}]`;
    case 'map':
      return `{ "key" => ${renderRbExample(value.value)} }`;
    case 'object':
      return value.fields.length === 0
        ? '{}'
        : `{ ${value.fields.map((f) => `${rbStr(f.name)} => ${renderRbExample(f.value)}`).join(', ')} }`;
    case 'union':
      return renderRbExample(value.variant);
    default:
      return 'nil';
  }
}

/** A JSON scalar (enum/const wire value) as a Ruby literal. */
function rbLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'nil';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return rbStr(String(v));
}

/** A double-quoted Ruby string literal (JSON quoting is valid Ruby for our inputs). */
function rbStr(s: string): string {
  return JSON.stringify(s);
}
