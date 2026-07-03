import type { ExampleValue } from '@xyd-js/opensdk-framework';

// Renders the framework's language-neutral ExampleValue tree into a Python
// literal, for the generated test suite (generateTests). The shared planner
// (planExample / planMethodExample) decides WHAT a realistic example is; this
// module only decides how Python spells it — so the Go and Python test suites
// exercise byte-identical shapes and can never drift.

/**
 * Render one ExampleValue as a Python literal expression. Object/map render as
 * dict literals keyed by the WIRE field name (our kwargs and request bodies
 * accept plain dicts, which the transport encodes); enums render as their raw
 * wire value (the transport encodes an Enum and its bare value identically, and
 * this keeps the test import-free of the enum symbol).
 */
export function renderPyExample(value: ExampleValue): string {
  switch (value.kind) {
    case 'string':
      return pyStr(value.value);
    case 'integer':
      return String(value.value);
    case 'number':
      return String(value.value);
    case 'boolean':
      return value.value ? 'True' : 'False';
    case 'null':
      return 'None';
    case 'binary':
      return 'b"Example data"';
    case 'enum':
      return pyLiteral(value.value);
    case 'const':
      return pyLiteral(value.value);
    case 'array':
      return `[${renderPyExample(value.item)}]`;
    case 'map':
      return `{"key": ${renderPyExample(value.value)}}`;
    case 'object':
      return value.fields.length === 0
        ? '{}'
        : `{${value.fields.map((f) => `${pyStr(f.name)}: ${renderPyExample(f.value)}`).join(', ')}}`;
    case 'union':
      return renderPyExample(value.variant);
    default:
      return 'None';
  }
}

/** A JSON scalar (enum/const wire value) as a Python literal. */
function pyLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  return pyStr(String(v));
}

/** A double-quoted Python string literal (JSON quoting is valid Python). */
function pyStr(s: string): string {
  return JSON.stringify(s);
}
