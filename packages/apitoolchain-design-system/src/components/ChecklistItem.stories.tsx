import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { ChecklistItem } from "./ChecklistItem";

const meta: Meta<typeof ChecklistItem> = {
  title: "Components/ChecklistItem",
  component: ChecklistItem,
  parameters: { layout: "centered" },
  argTypes: {
    icon: { control: "select", options: ICON_NAMES },
    step: { control: { type: "number", min: 1, max: 9 } },
    done: { control: "boolean" },
  },
  args: { icon: "key", label: "Create an API key", step: 1 },
};

export default meta;
type Story = StoryObj<typeof ChecklistItem>;

export const Default: Story = {};

export const WithoutStep: Story = {
  args: { icon: "dollar", label: "Add credits", step: undefined },
};

/** Completed steps are struck through + checked; pending steps stay normal. */
export const Done: Story = {
  render: () => (
    <div className="flex flex-col gap-[26px]">
      <ChecklistItem icon="key" label="Create an API key" step={1} done />
      <ChecklistItem icon="box" label="Test models" step={2} done />
      <ChecklistItem icon="dollar" label="Add credits" step={3} />
    </div>
  ),
};

export const Steps: Story = {
  render: () => (
    <div className="flex flex-col gap-[26px]">
      <ChecklistItem icon="key" label="Create an API key" step={1} done />
      <ChecklistItem icon="box" label="Test models" step={2} />
      <ChecklistItem icon="dollar" label="Add credits" step={3} />
    </div>
  ),
};
