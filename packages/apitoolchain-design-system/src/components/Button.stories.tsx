import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "ghost", "warning"],
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
  args: { children: "Delete", variant: "warning" },
};

export const WithIcon: Story = {
  args: { children: "New project", icon: "plus" },
};

/** A trailing icon — e.g. a chevron for a dropdown trigger (this is what Menu
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
