import { useState } from "react";
import type { CompiledSql, CompileOptions, FilterModel } from "./compile";
import { FilterComposer } from "./composer";
import type { FilterField, FilterSchema } from "./schema";

export interface FilterComposerController {
  /** The compiled schema (field defs + lookups) — e.g. to render the chips. */
  schema: FilterSchema;
  query: string;
  rules: FilterModel["rules"];
  available: FilterField[];
  /** The serializable model — e.g. for URL params. */
  model: FilterModel;
  setQuery: (query: string) => void;
  addRule: (key: string) => void;
  removeRule: (key: string) => void;
  toggleValue: (key: string, value: string) => void;
  compile: (opts?: CompileOptions) => CompiledSql;
  toSelect: (table?: string, alias?: string) => CompiledSql;
  /** Run the model over in-memory rows (client-side query). */
  run: <T>(rows: T[]) => T[];
  /** Serialize to a self-contained SQL string for the `?q=` URL param. */
  toQuery: (opts?: CompileOptions) => string;
}

/** React binding for {@link FilterComposer}: state + handlers + on-demand compile. */
export function useFilterComposer(
  schema: FilterSchema,
  initial?: Partial<FilterModel>,
): FilterComposerController {
  const [composer, setComposer] = useState(
    () =>
      new FilterComposer(schema, {
        query: initial?.query ?? "",
        rules: initial?.rules ?? [],
      }),
  );
  return {
    schema: composer.schema,
    query: composer.query,
    rules: composer.rules,
    available: composer.available,
    model: composer.model,
    setQuery: (q) => setComposer((c) => c.setQuery(q)),
    addRule: (k) => setComposer((c) => c.addRule(k)),
    removeRule: (k) => setComposer((c) => c.removeRule(k)),
    toggleValue: (k, v) => setComposer((c) => c.toggleValue(k, v)),
    compile: (opts) => composer.compile(opts),
    toSelect: (table, alias) => composer.toSelect(table, alias),
    run: (rows) => composer.run(rows),
    toQuery: (opts) => composer.toQuery(opts),
  };
}
