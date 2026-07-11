import { defineFilterSchema, useFilterComposer } from "@apitoolchain/filters";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { IconName } from "../icons";
import { ButtonFilter } from "./ButtonFilter";
import { FilterBar } from "./FilterBar";
import { Search } from "./Search";

// The domain filter schema — chip keys bound to SQL columns.
const SCHEMA = defineFilterSchema({
  table: "apis",
  fields: [
    {
      key: "namespace",
      label: "Namespace",
      column: "namespace",
      type: "enum",
      icon: "registry",
      values: [
        { value: "livesession", label: "livesession" },
        { value: "acme", label: "acme" },
      ],
    },
    {
      key: "language",
      label: "Language",
      column: "language",
      type: "enum",
      icon: "sdk",
      values: [
        { value: "go", label: "Go" },
        { value: "python", label: "Python" },
        { value: "node", label: "TypeScript" },
      ],
    },
    {
      key: "status",
      label: "Status",
      column: "status",
      type: "enum",
      icon: "check",
      values: [
        { value: "ready", label: "Ready" },
        { value: "building", label: "Building" },
      ],
    },
    {
      key: "name",
      label: "Name",
      column: "name",
      type: "text",
      icon: "search",
      freeText: true,
    },
  ],
});

interface StoryArgs {
  table: string;
  alias: string;
}

const meta: Meta<StoryArgs> = {
  title: "Components/FilterComposer",
  parameters: { layout: "padded" },
  argTypes: {
    table: { control: "text", description: "FROM table" },
    alias: {
      control: "text",
      description:
        "Column qualifier (e.g. filters → filters.language). Clear it for bare columns.",
    },
  },
  args: { table: "apis", alias: "filters" },
};

export default meta;
type Story = StoryObj<StoryArgs>;

function Row({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-subtle">
        {label}
      </div>
      <pre className="overflow-x-auto rounded-control border border-line bg-surface-muted px-3 py-2 text-xs text-ink">
        {children}
      </pre>
    </div>
  );
}

/**
 * The headless `useFilterComposer` drives the dumb `FilterBar`; as you pick
 * filters the panel shows the **compiled SQL** it produces (the new format) —
 * parameterized `{ sql, params }` — plus the serializable model.
 */
export const Default: Story = {
  render: (args) => {
    const f = useFilterComposer(SCHEMA, {
      rules: [{ key: "language", values: ["go", "python"] }],
    });
    // Picking a filter from the add menu opens its value picker straight away.
    const [justAdded, setJustAdded] = useState<string | null>(null);
    const compiled = f.compile({
      table: args.table || undefined,
      alias: args.alias || undefined,
    });

    return (
      <div className="flex max-w-[720px] flex-col gap-5">
        <FilterBar
          search={
            <Search
              value={f.query}
              onChange={f.setQuery}
              placeholder="Search APIs…"
            />
          }
          filters={
            <>
              {f.rules.map((rule) => {
                const def = SCHEMA.byKey[rule.key];
                if (!def) return null;
                const picked = (def.values ?? []).filter((v) =>
                  rule.values.includes(v.value),
                );
                return (
                  <ButtonFilter
                    key={rule.key}
                    icon={def.icon as IconName}
                    onRemove={() => f.removeRule(rule.key)}
                    defaultOpen={rule.key === justAdded}
                    valueLabel={
                      picked.length
                        ? picked.map((v) => v.label).join(", ")
                        : undefined
                    }
                    values={
                      def.values?.length
                        ? def.values.map((v) => ({
                            key: v.value,
                            label: v.label,
                            active: rule.values.includes(v.value),
                            onSelect: () => f.toggleValue(rule.key, v.value),
                          }))
                        : undefined
                    }
                  >
                    {def.label}
                  </ButtonFilter>
                );
              })}
              {f.available.length > 0 && (
                <ButtonFilter
                  items={f.available.map((d) => ({
                    key: d.key,
                    label: d.label,
                    icon: d.icon as IconName,
                    onSelect: () => {
                      f.addRule(d.key);
                      setJustAdded(d.values?.length ? d.key : null);
                    },
                  }))}
                >
                  Filter
                </ButtonFilter>
              )}
            </>
          }
        />

        <Row label="Compiled SQL">{compiled.sql}</Row>
        <Row label="Params">{JSON.stringify(compiled.params)}</Row>
        <Row label="Model">{JSON.stringify(f.model, null, 2)}</Row>
      </div>
    );
  },
};
