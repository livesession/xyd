import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { IconName } from "../icons";
import { ButtonFilter } from "./ButtonFilter";
import { FilterBar } from "./FilterBar";
import { Search } from "./Search";

type Def = {
  key: string;
  label: string;
  icon: IconName;
  values: { value: string; label: string }[];
};

const FILTERS: Def[] = [
  {
    key: "status",
    label: "Status",
    icon: "check",
    values: [
      { value: "ready", label: "Ready" },
      { value: "building", label: "Building" },
    ],
  },
  {
    key: "language",
    label: "Language",
    icon: "sdk",
    values: [
      { value: "go", label: "Go" },
      { value: "python", label: "Python" },
      { value: "node", label: "TypeScript" },
    ],
  },
  { key: "namespace", label: "Namespace", icon: "registry", values: [] },
];

const meta: Meta<typeof FilterBar> = {
  title: "Design System/FilterBar",
  component: FilterBar,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

/**
 * FilterBar has two EXACT slots — `search` and `filters`. You own the state (here
 * local; in the app `@apitoolchain/filters`' `useFilterComposer` owns it and
 * compiles the model to SQL — see the FilterComposer story).
 */
export const Default: Story = {
  render: () => {
    const [q, setQ] = useState("");
    const [rules, setRules] = useState<{ key: string; values: string[] }[]>([
      { key: "language", values: ["go", "python"] },
    ]);
    const has = (k: string) => rules.some((r) => r.key === k);
    const add = (k: string) =>
      setRules((r) => (has(k) ? r : [...r, { key: k, values: [] }]));
    const remove = (k: string) => setRules((r) => r.filter((x) => x.key !== k));
    const toggle = (k: string, v: string) =>
      setRules((r) =>
        r.map((x) =>
          x.key === k
            ? {
                ...x,
                values: x.values.includes(v)
                  ? x.values.filter((y) => y !== v)
                  : [...x.values, v],
              }
            : x,
        ),
      );

    return (
      <FilterBar
        search={<Search value={q} onChange={setQ} placeholder="Search APIs…" />}
        filters={
          <>
            {rules.map((rule) => {
              const def = FILTERS.find((f) => f.key === rule.key);
              if (!def) return null;
              const picked = def.values.filter((v) =>
                rule.values.includes(v.value),
              );
              return (
                <ButtonFilter
                  key={rule.key}
                  icon={def.icon}
                  onRemove={() => remove(rule.key)}
                  valueLabel={
                    picked.length
                      ? picked.map((v) => v.label).join(", ")
                      : undefined
                  }
                  values={
                    def.values.length
                      ? def.values.map((v) => ({
                          key: v.value,
                          label: v.label,
                          active: rule.values.includes(v.value),
                          onSelect: () => toggle(rule.key, v.value),
                        }))
                      : undefined
                  }
                >
                  {def.label}
                </ButtonFilter>
              );
            })}
            {FILTERS.filter((f) => !has(f.key)).length > 0 && (
              <ButtonFilter
                items={FILTERS.filter((f) => !has(f.key)).map((f) => ({
                  key: f.key,
                  label: f.label,
                  icon: f.icon,
                  onSelect: () => add(f.key),
                }))}
              >
                Filter
              </ButtonFilter>
            )}
          </>
        }
      />
    );
  },
};
