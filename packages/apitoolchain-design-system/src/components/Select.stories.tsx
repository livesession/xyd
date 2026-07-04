import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Design System/Select",
  component: Select,
  parameters: { layout: "centered" },
  argTypes: {
    onChange: { action: "changed" },
  },
  args: {
    options: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o mini" },
      { value: "o1", label: "o1" },
      { value: "o1-mini", label: "o1-mini" },
    ],
    defaultValue: "gpt-4o",
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

/** A controlled select pinned to a specific value. */
export const Controlled: Story = {
  args: { value: "o1", defaultValue: undefined },
};
