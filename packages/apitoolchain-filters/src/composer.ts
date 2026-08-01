import {
  type CompiledSql,
  type CompileOptions,
  compileFilters,
  type FilterModel,
} from "./compile";
import { toQuery } from "./query";
import { runFilters } from "./run";
import type { FilterField, FilterSchema } from "./schema";

const EMPTY: FilterModel = { query: "", rules: [] };

/**
 * Immutable filter engine: holds the model (search + rules) and compiles it to
 * parameterized SQL. Framework-agnostic — usable server-side without React.
 * Every mutator returns a NEW composer (the React hook wraps it in state).
 */
export class FilterComposer {
  constructor(
    readonly schema: FilterSchema,
    readonly model: FilterModel = EMPTY,
  ) {}

  get query(): string {
    return this.model.query;
  }

  get rules(): FilterModel["rules"] {
    return this.model.rules;
  }

  /**
   * Fields addable as chips — feed the add-filter dropdown. Excludes free-text
   * fields (they power the Search box, not a chip) and already-applied rules.
   */
  get available(): FilterField[] {
    return this.schema.fields.filter(
      (f) => !f.freeText && !this.model.rules.some((r) => r.key === f.key),
    );
  }

  setQuery(query: string): FilterComposer {
    return new FilterComposer(this.schema, { ...this.model, query });
  }

  addRule(key: string): FilterComposer {
    if (
      !this.schema.byKey[key] ||
      this.model.rules.some((r) => r.key === key)
    ) {
      return this;
    }
    return new FilterComposer(this.schema, {
      ...this.model,
      rules: [...this.model.rules, { key, values: [] }],
    });
  }

  removeRule(key: string): FilterComposer {
    return new FilterComposer(this.schema, {
      ...this.model,
      rules: this.model.rules.filter((r) => r.key !== key),
    });
  }

  toggleValue(key: string, value: string): FilterComposer {
    return new FilterComposer(this.schema, {
      ...this.model,
      rules: this.model.rules.map((r) =>
        r.key === key
          ? {
              ...r,
              values: r.values.includes(value)
                ? r.values.filter((v) => v !== value)
                : [...r.values, value],
            }
          : r,
      ),
    });
  }

  /** Compile the model to parameterized SQL (`SELECT * FROM <table> WHERE …`). */
  compile(opts?: CompileOptions): CompiledSql {
    return compileFilters(this.schema, this.model, opts);
  }

  /** Convenience: compile against a specific table + column alias (else schema defaults). */
  toSelect(table?: string, alias?: string): CompiledSql {
    return compileFilters(this.schema, this.model, { table, alias });
  }

  /** Run the model over in-memory rows (client-side twin of {@link compile}). */
  run<T>(rows: T[]): T[] {
    return runFilters(this.schema, this.model, rows);
  }

  /** Serialize to a self-contained SQL string for the `?q=` URL param. */
  toQuery(opts?: CompileOptions): string {
    return toQuery(this.schema, this.model, opts);
  }
}
