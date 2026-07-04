import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { ChecklistItem } from "./ChecklistItem";

const meta: Meta<typeof ChecklistItem> = {
  title: "Design System/ChecklistItem",
  component: ChecklistItem,
  parameters: { layout: "centered" },
  argTypes: {
    icon: { control: "select", options: ICON_NAMES },
    step: { control: { type: "number", min: 1, max: 9 } },
  },
  args: { icon: "key", label: "Create an API key", step: 1 },
};

export default meta;
type Story = StoryObj<typeof ChecklistItem>;

export const Default: Story = {};

export const WithoutStep: Story = {
  args: { icon: "dollar", label: "Add credits", step: undefined },
};

export const Steps: Story = {
  render: () => (
    <div className="flex flex-col gap-[26px]">
      <ChecklistItem icon="key" label="Create an API key" step={1} />
      <ChecklistItem icon="box" label="Test models" step={2} />
      <ChecklistItem icon="dollar" label="Add credits" step={3} />
    </div>
  ),
};
