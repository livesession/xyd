import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Combobox,
  type ComboboxOption,
  type ComboboxProps,
} from "./Combobox";

const meta: Meta<typeof Combobox> = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[340px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const DIST_TAGS = [
  { value: "*", label: "All dist-tags", exclusive: true, icon: "tags-outline" },
  { value: "latest" },
  { value: "canary" },
  { value: "beta" },
  { value: "next" },
] satisfies ComboboxOption[];

function Demo(args: Partial<ComboboxProps> & { initial?: string[] }) {
  const [value, setValue] = useState<string[]>(args.initial ?? ["latest"]);
  return (
    <Combobox
      options={DIST_TAGS}
      placeholder="Select dist-tags…"
      {...args}
      value={value}
      onChange={setValue}
    />
  );
}

/** Multi-select dist-tags — check from the list or type your own. */
export const Default: Story = { render: () => <Demo /> };

/** Preset-only (typing filters, but you can't add values off the list). */
export const NoCustom: Story = { render: () => <Demo allowCustom={false} /> };

/** Empty, showing the placeholder. */
export const Empty: Story = { render: () => <Demo initial={[]} /> };
