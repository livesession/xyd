import type { Meta, StoryObj } from "@storybook/react";
import { Segmented } from "./Segmented";

const meta: Meta<typeof Segmented> = {
  title: "Components/Segmented",
  component: Segmented,
  parameters: { layout: "centered" },
  argTypes: {
    onChange: { action: "changed" },
  },
  args: { options: ["24h", "7d", "30d", "90d"], value: "24h" },
};

export default meta;
type Story = StoryObj<typeof Segmented>;

export const Default: Story = {};

export const CustomOptions: Story = {
  args: { options: ["Day", "Week", "Month"], value: "Week" },
};
