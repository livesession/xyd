import type { FilterModel } from "./compile";
import type { FilterField, FilterSchema } from "./schema";

/** Row value(s) for a field — the field `key` is the row property; arrays pass through. */
function valuesOf(row: Record<string, unknown>, key: string): string[] {
  const v = row[key];
  const arr = Array.isArray(v) ? v : [v];
  return arr.map((x) => String(x ?? "").toLowerCase());
}

function ruleMatches(
  field: FilterField,
  values: string[],
  row: Record<string, unknown>,
): boolean {
  const wanted = values.map((v) => v.toLowerCase());
  const rowValues = valuesOf(row, field.key);
  if (field.type === "text") {
    // A rule value is a contains-term against any of the row's values.
    return wanted.some((w) => rowValues.some((rv) => rv.includes(w)));
  }
  // enum / number / boolean → membership (mirrors SQL `IN`).
  return wanted.some((w) => rowValues.includes(w));
}

/**
 * Run a filter model over in-memory rows — the client-side twin of
 * {@link compileFilters}. Rules are AND-ed (a rule's values are OR-ed, i.e.
 * membership); the search box is a contains-match across the freeText fields.
 * A field's value is read from `row[field.key]` (arrays are matched element-wise).
 */
export function runFilters<T>(
  schema: FilterSchema,
  model: FilterModel,
  rows: T[],
): T[] {
  const query = model.query.trim().toLowerCase();
  const active = model.rules.filter(
    (r) => schema.byKey[r.key] && r.values.length > 0,
  );
  const freeText = schema.fields.filter((f) => f.freeText);

  return rows.filter((row) => {
    const r = row as Record<string, unknown>;
    for (const rule of active) {
      if (!ruleMatches(schema.byKey[rule.key], rule.values, r)) return false;
    }
    if (query && freeText.length > 0) {
      const hit = freeText.some((f) =>
        valuesOf(r, f.key).some((v) => v.includes(query)),
      );
      if (!hit) return false;
    }
    return true;
  });
}
