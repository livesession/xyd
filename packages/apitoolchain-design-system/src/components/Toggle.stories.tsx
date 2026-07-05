import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Design System/Toggle",
  component: Toggle,
  parameters: { layout: "centered" },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: { checked: true },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {};

export const Interactive: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return <Toggle checked={on} onChange={setOn} aria-label="Toggle" />;
  },
};
