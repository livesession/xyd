import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { Dropdown } from "./Dropdown";

const items = [
  {
    key: "production",
    label: "Production",
    icon: "bolt" as const,
    active: true,
  },
  { key: "staging", label: "Staging", icon: "box" as const },
  { key: "development", label: "Development", icon: "box" as const },
];

const meta: Meta<typeof Dropdown> = {
  title: "Components/Dropdown",
  component: Dropdown,
  parameters: { layout: "centered" },
  argTypes: {
    icon: { control: "select", options: ["", ...ICON_NAMES] },
    align: { control: "inline-radio", options: ["left", "right"] },
    variant: { control: "inline-radio", options: ["select", "ghost"] },
  },
  args: {
    label: "Production",
    items,
    align: "left",
    variant: "select",
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-[240px] items-start justify-center pt-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

/** The bordered dropdown selector. Click to open the item list. */
export const Select: Story = {};

/** The bare button trigger, used inline without a visible border. */
export const Ghost: Story = {
  args: { variant: "ghost" },
};

/** A leading trigger icon plus a right-aligned dropdown panel. */
export const WithIconRightAligned: Story = {
  args: { icon: "settings", align: "right" },
};
