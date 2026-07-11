import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Icon } from "../icons";
import { ComboboxMenu, type ComboboxMenuOption } from "./ComboboxMenu";

const meta: Meta<typeof ComboboxMenu> = {
  title: "Components/ComboboxMenu",
  component: ComboboxMenu,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComboboxMenu>;

const TAGS = [
  { value: "none", label: "No dist-tag", exclusive: true },
  { value: "latest" },
  { value: "canary" },
  { value: "beta" },
] satisfies ComboboxMenuOption[];

/**
 * Just the open menu — a filter input, checkable rows, an `Add "…"` row, and the
 * `exclusive` option pinned above a separator. The trigger is collapsed to zero
 * height so only the panel shows.
 */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("latest");
    return (
      <ComboboxMenu
        options={TAGS}
        selected={[value]}
        onSelect={setValue}
        allowCustom
        defaultOpen
        searchPlaceholder="Find or create a dist-tag…"
      >
        {() => <span aria-hidden className="block h-0" />}
      </ComboboxMenu>
    );
  },
};

/**
 * Single-select with a plain-input-style trigger — the exact "New version"
 * dist-tag use case: pick an existing tag, type a new one, or choose the
 * set-apart "No dist-tag".
 */
function InputTrigger() {
  const [value, setValue] = useState("latest");
  return (
    <ComboboxMenu
      options={TAGS}
      selected={[value]}
      onSelect={setValue}
      allowCustom
      closeOnSelect
      searchPlaceholder="Find or create a dist-tag…"
    >
      {({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="flex h-[38px] w-full items-center justify-between rounded-control border border-line bg-surface px-3 text-left text-sm"
        >
          <span className={value === "none" ? "text-muted" : "text-ink"}>
            {value === "none" ? "No dist-tag" : value}
          </span>
          <Icon icon="chevronUpDown" size={14} className="text-muted" />
        </button>
      )}
    </ComboboxMenu>
  );
}

export const InputStyleTrigger: Story = { render: () => <InputTrigger /> };

/** The same menu behind a button trigger — the trigger is entirely yours. */
function ButtonTrigger() {
  const [value, setValue] = useState("latest");
  return (
    <ComboboxMenu
      options={TAGS}
      selected={[value]}
      onSelect={setValue}
      allowCustom
      closeOnSelect
    >
      {({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-pill border border-transparent bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          <Icon icon="tags-outline" size={14} />
          {value === "none" ? "No dist-tag" : value}
          <Icon
            icon="chevronDown"
            size={14}
            className={open ? "rotate-180" : ""}
          />
        </button>
      )}
    </ComboboxMenu>
  );
}

export const ButtonStyleTrigger: Story = { render: () => <ButtonTrigger /> };
