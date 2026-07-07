import type { FilterComposerController } from "@apitoolchain/filters";
import { type ReactNode, useState } from "react";
import type { IconName } from "../icons";
import { ButtonFilter } from "./ButtonFilter";
import { FilterBar } from "./FilterBar";
import type { LinkComponent } from "./routing";
import { Search } from "./Search";
import { type Column, Table } from "./Table";

export interface LaTableProps<T> {
  /**
   * The filter engine driving the bar + the query — from `useFilterComposer`.
   * Only its TYPE is imported here (erased at build), so the design system takes
   * no runtime dependency on `@apitoolchain/filters`.
   */
  filter: FilterComposerController;
  data: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  searchPlaceholder?: string;
  addLabel?: string;
  rowHref?: (row: T) => string;
  linkComponent?: LinkComponent;
  empty?: ReactNode;
  className?: string;
}

/**
 * A filterable table: the {@link FilterBar} (search + rule chips) is wired to a
 * FilterComposer, and the rows are the composer's in-memory query over `data`
 * (`filter.run(data)`). Introduce your table via `columns` + `data`, hand it a
 * composer, and it queries the data live as filters change.
 */
export function LaTable<T>({
  filter,
  data,
  columns,
  getRowKey,
  searchPlaceholder,
  addLabel = "Filter",
  rowHref,
  linkComponent,
  empty,
  className,
}: LaTableProps<T>) {
  const rows = filter.run(data);
  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <FilterBar
        search={
          <Search
            value={filter.query}
            onChange={filter.setQuery}
            placeholder={searchPlaceholder}
          />
        }
        filters={<LaTableFilters filter={filter} addLabel={addLabel} />}
      />
      <Table
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
        rowHref={rowHref}
        linkComponent={linkComponent}
        empty={empty}
      />
    </div>
  );
}

/** The applied-rule chips + the add-filter dropdown, derived from the composer. */
function LaTableFilters({
  filter,
  addLabel,
}: {
  filter: FilterComposerController;
  addLabel: string;
}) {
  // The rule just added from the add-filter menu — its value picker opens on
  // mount so picking a filter flows straight into picking its value. Read once
  // at chip mount (see ButtonFilter/DropdownMenu `defaultOpen`), so rules
  // restored from the URL on first render never auto-open.
  const [justAdded, setJustAdded] = useState<string | null>(null);
  return (
    <>
      {filter.rules.map((rule) => {
        const def = filter.schema.byKey[rule.key];
        if (!def) return null;
        const picked = (def.values ?? []).filter((v) =>
          rule.values.includes(v.value),
        );
        return (
          <ButtonFilter
            key={rule.key}
            icon={def.icon as IconName}
            onRemove={() => filter.removeRule(rule.key)}
            defaultOpen={rule.key === justAdded}
            valueLabel={
              picked.length ? picked.map((v) => v.label).join(", ") : undefined
            }
            values={
              def.values?.length
                ? def.values.map((v) => ({
                    key: v.value,
                    label: v.label,
                    active: rule.values.includes(v.value),
                    onSelect: () => filter.toggleValue(rule.key, v.value),
                  }))
                : undefined
            }
          >
            {def.label}
          </ButtonFilter>
        );
      })}
      {filter.available.length > 0 && (
        <ButtonFilter
          items={filter.available.map((d) => ({
            key: d.key,
            label: d.label,
            icon: d.icon as IconName,
            onSelect: () => {
              filter.addRule(d.key);
              // Only value-bearing filters have a picker to open.
              setJustAdded(d.values?.length ? d.key : null);
            },
          }))}
        >
          {addLabel}
        </ButtonFilter>
      )}
    </>
  );
}
