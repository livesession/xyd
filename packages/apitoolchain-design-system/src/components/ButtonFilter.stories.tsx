import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { IconName } from "../icons";
import { ButtonFilter } from "./ButtonFilter";

const meta: Meta<typeof ButtonFilter> = {
  title: "Components/ButtonFilter",
  component: ButtonFilter,
  parameters: { layout: "padded" },
  args: { children: "Filter" },
};

export default meta;
type Story = StoryObj<typeof ButtonFilter>;

const FILTERS: { key: string; label: string; icon: IconName }[] = [
  { key: "status", label: "Status", icon: "check" },
  { key: "language", label: "Language", icon: "sdk" },
  { key: "namespace", label: "Namespace", icon: "registry" },
];

const LANGS = [
  { value: "go", label: "Go" },
  { value: "python", label: "Python" },
  { value: "node", label: "TypeScript" },
];

/** The add-filter trigger: a `plus` pill that opens the filter dropdown. */
export const AddTrigger: Story = {
  render: () => (
    <ButtonFilter
      items={FILTERS.map((f) => ({ key: f.key, label: f.label, icon: f.icon }))}
    >
      Filter
    </ButtonFilter>
  ),
};

/** An applied rule with a multi-select value picker + a × to clear it. */
export const AppliedRule: Story = {
  render: () => {
    const [sel, setSel] = useState<string[]>(["go", "python"]);
    const toggle = (v: string) =>
      setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
    return (
      <ButtonFilter
        icon="sdk"
        onRemove={() => {}}
        valueLabel={
          sel.length
            ? sel.map((v) => LANGS.find((l) => l.value === v)?.label).join(", ")
            : undefined
        }
        values={LANGS.map((l) => ({
          key: l.value,
          label: l.label,
          active: sel.includes(l.value),
          onSelect: () => toggle(l.value),
        }))}
      >
        Language
      </ButtonFilter>
    );
  },
};
