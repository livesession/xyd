import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: [
        "primary",
        "secondary",
        "ghost",
        "warning",
        "danger",
        "danger-ghost",
      ],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    icon: { control: "select", options: ["", ...ICON_NAMES] },
    iconRight: { control: "select", options: ["", ...ICON_NAMES] },
    onClick: { action: "clicked" },
  },
  args: {
    children: "Create key",
    variant: "primary",
    size: "md",
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { children: "Cancel", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Dismiss", variant: "ghost" },
};

export const Warning: Story = {
  args: { children: "Archive", variant: "warning" },
};

export const Danger: Story = {
  args: { children: "Delete", variant: "danger" },
};

/** Ghost, tinted danger — a subtle destructive action (red text + icon), e.g. a
 * Remove with the trash glyph. */
export const DangerGhost: Story = {
  args: { children: "Remove", variant: "danger-ghost", icon: "trash" },
};

export const WithIcon: Story = {
  args: { children: "New project", icon: "plus" },
};

/** A trailing icon — e.g. a chevron for a dropdown trigger (this is what Dropdown
 * uses under the hood). */
export const WithIconRight: Story = {
  args: { children: "Options", iconRight: "chevronDown", variant: "secondary" },
};

export const Small: Story = {
  args: { children: "Copy", size: "sm", variant: "secondary" },
};

export const Disabled: Story = {
  args: { children: "Create key", disabled: true },
};

/** A link that opens in a new tab — a trailing ↗ tells users it leaves the
 * current tab. */
export const NewTab: Story = {
  args: {
    children: "Open editor ↗",
    variant: "secondary",
    icon: "docs",
    href: "https://example.com",
    newTab: true,
  },
};
