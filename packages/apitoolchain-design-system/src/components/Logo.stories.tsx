import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "./Logo";

const meta: Meta<typeof Logo> = {
  title: "Design System/Logo",
  component: Logo,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: 64 },
};

export const OnDark: Story = {
  args: { size: 64 },
  parameters: { backgrounds: { default: "dark" } },
  decorators: [
    (Story) => (
      <div className="rounded-panel bg-ink p-8 text-surface">
        <Story />
      </div>
    ),
  ],
};
