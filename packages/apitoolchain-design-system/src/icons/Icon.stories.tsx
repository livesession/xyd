import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import { ICON_NAMES } from "./registry";

const meta: Meta<typeof Icon> = {
  title: "Components/Icon",
  component: Icon,
  parameters: { layout: "centered" },
  argTypes: {
    icon: { control: "select", options: ICON_NAMES },
    size: { control: { type: "range", min: 12, max: 64, step: 1 } },
    strokeWidth: { control: { type: "range", min: 1, max: 3, step: 0.1 } },
  },
  args: { icon: "home", size: 24 },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const Tinted: Story = {
  args: { icon: "shield", size: 40 },
  render: (args) => (
    <div className="text-pink">
      <Icon {...args} />
    </div>
  ),
};
