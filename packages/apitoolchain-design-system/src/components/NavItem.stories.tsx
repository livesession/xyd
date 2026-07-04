import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { NavItem } from "./NavItem";

const meta: Meta<typeof NavItem> = {
  title: "Design System/NavItem",
  component: NavItem,
  parameters: { layout: "centered", backgrounds: { default: "muted" } },
  argTypes: {
    icon: { control: "select", options: ICON_NAMES },
    onSelect: { action: "select" },
  },
  args: { icon: "home", label: "Home", active: false, collapsed: false },
  decorators: [
    (Story) => (
      <div className="w-60 rounded-panel bg-surface-muted p-2">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Resting: Story = {};

export const Active: Story = {
  args: { active: true },
};

export const Collapsed: Story = {
  args: { collapsed: true },
  decorators: [
    (Story) => (
      <div className="w-[68px] rounded-panel bg-surface-muted p-2">
        <Story />
      </div>
    ),
  ],
};
