export type FilterFieldType = "enum" | "text" | "number" | "boolean";

export interface FilterValue {
  value: string;
  label: string;
}

/** One filterable field: a chip key bound to a SQL column. */
export interface FilterField {
  /** Chip key used in the model, e.g. "language". */
  key: string;
  label: string;
  /** SQL column (may be qualified, e.g. "t.language"). */
  column: string;
  type: FilterFieldType;
  /** Enum options — drive the chip's value picker. */
  values?: FilterValue[];
  /** Icon name for the chip (resolved by the UI). */
  icon?: string;
  /** Participate in the Search box's LIKE OR-set. */
  freeText?: boolean;
}

export interface FilterSchemaDef {
  /** Default `FROM` table the composer selects from. */
  table: string;
  /** Default column qualifier / table alias (e.g. "filters" → `filters.language`). */
  alias?: string;
  fields: FilterField[];
}

export interface FilterSchema extends FilterSchemaDef {
  byKey: Record<string, FilterField>;
  freeTextColumns: string[];
}

/** Compile a declarative schema into lookup structures (throws on dup keys). */
export function defineFilterSchema(def: FilterSchemaDef): FilterSchema {
  const byKey: Record<string, FilterField> = {};
  for (const f of def.fields) {
    if (byKey[f.key]) throw new Error(`duplicate filter key "${f.key}"`);
    byKey[f.key] = f;
  }
  return {
    ...def,
    byKey,
    freeTextColumns: def.fields.filter((f) => f.freeText).map((f) => f.column),
  };
}
