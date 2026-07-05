import {
  type CompiledSql,
  type CompileOptions,
  compileFilters,
  type FilterModel,
} from "./compile";
import type { FilterField, FilterSchema } from "./schema";

/** A SQL literal for a param value (for the inline URL form — no placeholders). */
function literal(v: unknown): string {
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
}

/**
 * Serialize a model to a self-contained SQL string (values inlined, no `$n`
 * placeholders) — meant for the `?q=` URL param. It's the same query
 * {@link compileFilters} produces, just with the params substituted in.
 */
export function toQuery(
  schema: FilterSchema,
  model: FilterModel,
  opts: CompileOptions = {},
): string {
  const compiled: CompiledSql = compileFilters(schema, model, opts);
  return compiled.sql.replace(/\$(\d+)/g, (_, n) =>
    literal(compiled.params[Number(n) - 1]),
  );
}

/** Normalize a SQL column token (`"filters"."namespace"` / `f.name`) to its base. */
function baseColumn(token: string): string {
  const noQuotes = token.replace(/"/g, "").trim();
  const dot = noQuotes.lastIndexOf(".");
  return dot >= 0 ? noQuotes.slice(dot + 1) : noQuotes;
}

/** Column (or key) → field lookup for the reverse mapping. */
function columnIndex(schema: FilterSchema): Record<string, FilterField> {
  const index: Record<string, FilterField> = {};
  for (const field of schema.fields) {
    index[baseColumn(field.column)] = field;
    index[field.key] = field;
  }
  return index;
}

/** Split a top-level comma list, respecting quotes. */
function splitList(inner: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inStr = false;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inStr) {
      if (ch === "'" && inner[i + 1] === "'") {
        buf += "'";
        i++;
      } else if (ch === "'") {
        inStr = false;
      } else {
        buf += ch;
      }
      continue;
    }
    if (ch === "'") {
      inStr = true;
    } else if (ch === ",") {
      out.push(buf.trim());
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out.map((v) => v.replace(/^'|'$/g, "")).filter((v) => v !== "");
}

/** Strip surrounding `%` from a `like` pattern → the contains-value. */
function unlike(pattern: string): string {
  let v = pattern;
  if (v.startsWith("%")) v = v.slice(1);
  if (v.endsWith("%")) v = v.slice(0, -1);
  return v;
}

/**
 * Parse a `?q=` SQL string back into a {@link FilterModel} — the inverse of
 * {@link toQuery}. Recognizes `col in (...)`, `lower(col) like '%x%'` (free-text
 * search or text rule), and `col = true|false`. Structure (AND/OR/parens) is
 * ignored; the meaningful conditions are extracted by shape. Unknown columns are
 * skipped, so a hand-typed query never throws.
 */
export function parseQuery(
  schema: FilterSchema,
  input?: string | null,
): FilterModel {
  const empty: FilterModel = { query: "", rules: [] };
  if (!input || !input.trim()) return empty;

  let sql = input.trim();
  const whereAt = sql.toLowerCase().indexOf(" where ");
  if (whereAt >= 0) sql = sql.slice(whereAt + 7);

  const index = columnIndex(schema);
  const fieldFor = (token: string) => index[baseColumn(token)];
  const rules: FilterModel["rules"] = [];

  // `col in ('a', 'b')`
  for (const m of sql.matchAll(/([\w".]+)\s+in\s*\(([^)]*)\)/gi)) {
    const field = fieldFor(m[1]);
    if (!field) continue;
    const values = splitList(m[2]);
    if (values.length) rules.push({ key: field.key, values });
  }

  // `col = true|false`
  for (const m of sql.matchAll(/([\w".]+)\s*=\s*(true|false)\b/gi)) {
    const field = fieldFor(m[1]);
    if (field?.type === "boolean") {
      rules.push({ key: field.key, values: [m[2].toLowerCase()] });
    }
  }

  // `lower(col) like '%x%'` — free-text search or a text rule
  const freeText = new Set<string>();
  const textRules = new Map<string, string[]>();
  for (const m of sql.matchAll(
    /lower\(([\w".]+)\)\s+like\s+'((?:[^']|'')*)'/gi,
  )) {
    const field = fieldFor(m[1]);
    if (!field) continue;
    const value = unlike(m[2].replace(/''/g, "'"));
    if (field.freeText) {
      freeText.add(value);
    } else {
      const arr = textRules.get(field.key) ?? [];
      arr.push(value);
      textRules.set(field.key, arr);
    }
  }
  const query = freeText.size ? [...freeText][0] : "";
  for (const [key, values] of textRules) rules.push({ key, values });

  return { query, rules };
}
