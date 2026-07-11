import type { Meta, StoryObj } from "@storybook/react";
import { ButtonGroup } from "./ButtonGroup";

const meta: Meta<typeof ButtonGroup> = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] },
    align: { control: "inline-radio", options: ["left", "right"] },
    onClick: { action: "primary" },
  },
  args: {
    label: "Register API",
    icon: "plus",
    variant: "primary",
    items: [{ key: "import", label: "Import…", icon: "plus" }],
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {};

/** Primary action disabled (onboarding gate) — the caret dropdown still opens. */
export const DisabledPrimary: Story = {
  args: {
    disabled: true,
    title: "Connect your workspace to register APIs",
    items: [{ key: "import", label: "Import…", icon: "plus" }],
  },
};

export const Secondary: Story = {
  args: {
    label: "Actions",
    variant: "secondary",
    icon: undefined,
    items: [
      { key: "edit", label: "Edit" },
      { key: "duplicate", label: "Duplicate" },
      { key: "delete", label: "Delete" },
    ],
  },
};
