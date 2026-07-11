import {
  DummyDriver,
  type Expression,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type SqlBool,
  sql,
} from "kysely";
import type { FilterSchema } from "./schema";

/** One applied filter rule (a chip): a field key + its picked values. */
export interface AppliedFilter {
  key: string;
  values: string[];
}

/** The serializable filter model — a search box + applied rules. */
export interface FilterModel {
  query: string;
  rules: AppliedFilter[];
}

/** Parameterized SQL: `sql` uses `$1…` placeholders, values live only in `params`. */
export interface CompiledSql {
  sql: string;
  params: unknown[];
}

export interface CompileOptions {
  /** Override the schema's default `FROM` table. */
  table?: string;
  /**
   * Qualify columns with this alias — bare columns become `alias.column` and the
   * table is emitted as `FROM <table> AS <alias>` (so e.g. `filters.language`).
   * A column that is already dotted (pre-qualified) is left untouched.
   */
  alias?: string;
}

// A dynamic (column names not statically known) SQL surface.
type AnyDb = Record<string, Record<string, unknown>>;

// A connectionless Kysely — Postgres dialect + DummyDriver → compile only, no
// driver ever runs. Safe to construct once and reuse (in the browser too).
const db = new Kysely<AnyDb>({
  dialect: {
    createDriver: () => new DummyDriver(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: (d) => new PostgresIntrospector(d),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});

/** A column reference, qualified with the alias unless it's already dotted. */
function colRef(column: string, alias?: string) {
  return sql.ref(
    alias && !column.includes(".") ? `${alias}.${column}` : column,
  );
}

/** `lower(col) like %value%` — case-insensitive contains. */
function likeCond(
  column: string,
  value: string,
  alias?: string,
): Expression<SqlBool> {
  return sql<SqlBool>`lower(${colRef(column, alias)}) like ${`%${value.toLowerCase()}%`}`;
}

/**
 * Compile a filter model to a parameterized `SELECT * FROM <table> WHERE …`.
 * Rules are AND-ed; a rule's multiple values become `IN (…)`; the search box
 * becomes an OR of `LIKE` across the schema's freeText columns.
 */
export function compileFilters(
  schema: FilterSchema,
  model: FilterModel,
  opts: CompileOptions = {},
): CompiledSql {
  const table = opts.table ?? schema.table;
  const alias = opts.alias ?? schema.alias;
  const query = model.query.trim();
  const freeText = schema.freeTextColumns;

  const activeRules = model.rules.filter(
    (r) => schema.byKey[r.key] && r.values.length > 0,
  );
  const hasFreeText = query.length > 0 && freeText.length > 0;

  const from = alias ? `${table} as ${alias}` : table;
  const base = db.selectFrom(from).selectAll();
  const built =
    activeRules.length > 0 || hasFreeText
      ? base.where((eb) => {
          const parts: Expression<SqlBool>[] = [];
          for (const rule of activeRules) {
            const field = schema.byKey[rule.key];
            if (field.type === "text") {
              parts.push(
                eb.or(rule.values.map((v) => likeCond(field.column, v, alias))),
              );
            } else if (field.type === "boolean") {
              parts.push(
                sql<SqlBool>`${colRef(field.column, alias)} = ${rule.values[0] === "true"}`,
              );
            } else {
              const vals =
                field.type === "number" ? rule.values.map(Number) : rule.values;
              parts.push(
                sql<SqlBool>`${colRef(field.column, alias)} in (${sql.join(vals)})`,
              );
            }
          }
          if (hasFreeText) {
            parts.push(eb.or(freeText.map((c) => likeCond(c, query, alias))));
          }
          return eb.and(parts);
        })
      : base;

  const compiled = built.compile();
  return { sql: compiled.sql, params: [...compiled.parameters] };
}
